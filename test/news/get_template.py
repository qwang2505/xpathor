'''
Created on: Sep 03, 2014

@author: qwang
'''
import re
import codecs
import chardet
import pymongo
import simplejson
import BeautifulSoup
from lxml.html import fromstring
from urlparse import urlparse

_CONTENT_TYPE_META_REG_ = re.compile(r'<\s*meta[^>]+charset=\"?([^>]+?)[;\'\">]', re.I)

def _get_encoding_from_header(headers, body):
    content_type = headers['Content-Type']
    if content_type is not None and (isinstance(content_type, str) or isinstance(content_type, unicode)):
        charset = BeautifulSoup.CHARSET_RE.search(content_type)
    else:
        charset = None
    return charset and charset.group(3) or None

def _get_encoding_from_meta(headers, body):
    match = _CONTENT_TYPE_META_REG_.search(body[0:1024])
    if match is not None:
        encoding = match.group(1).strip().lower()
        if len(encoding) == 0:
            return None
        else:
            return encoding
    else:
        return None

def _get_encoding_by_chardet(headers, body):
    return chardet.detect(body)['encoding']

def _try_get_encoding(headers, body, try_count):
    attempts = [_get_encoding_from_header, _get_encoding_from_meta, 
                lambda headers, body : "GBK",
                lambda headers, body : "gb2312",
                #_get_encoding_by_chardet,
                lambda headers, body : "utf-8", lambda headers, body : None]

    encoding = None
    for i in range(try_count, len(attempts)):
        encoding = attempts[i](headers, body)
        if encoding is not None:
            return encoding, i
    return None, len(attempts)

def _try_decode(url, body, encode):
    html = None
    try:
        decoder = codecs.lookup(encode)
        html = decoder.decode(body)[0]
    except Exception:
        #print "try decode failed ", encode, url
        pass
    return html

def decode(url, headers, body, encoding=None):
    '''
    decode html to unicode
    '''

    try_count = 0

    while True:
        if encoding is not None:
            try_count = -1
        else:
            encoding, try_count = _try_get_encoding(headers, body, try_count)
            if encoding is None:
                #print "decoding failed for url ", url
                return None, None
        html = _try_decode(url, body, encoding)
        if html is not None:
            return html, encoding
        else:
            try_count += 1
            encoding = None


_TOP_DOMAINS = ['com', 'edu', 'gov', 'int', 'mil', 'net', 'org', 'biz', 'info', 'pro', 'name', 'museum', \
        'coop', 'aero', 'idv', 'xxx']

def get_fuzzy_domains(url):
    ''' get hosts '''
    u = urlparse(url)
    keys = []
    keys.append(u.netloc)
    paths = u.path.split('/')
    keys.extend(paths)
    keys = [x for x in keys if x != '']
    hosts = []
    i = 1
    for _ in keys:
        hosts.append('/'.join(keys[0:i]))
        i += 1
    domain_frags = u.netloc.lower().split('.')
    while len(domain_frags) >= 2:
        if len(domain_frags) == 2 and domain_frags[0] in _TOP_DOMAINS:
            break
        domain = '.'.join(domain_frags)
        if domain == u.netloc:
            domain_frags.pop(0)
            continue
        hosts.insert(0, domain)
        domain_frags.pop(0)
    return reversed(hosts)

def _get_text_content(node):
    return node.text_content()

def _get_item(node, xpath):
    func = None
    if xpath.endswith('/text_content()'):
        xpath = xpath.replace('/text_content()', '')
        func = _get_text_content
    item = None
    try:
        item = node.xpath(xpath)[0]
        if isinstance(item, list):
            item = item[0]
    except (IndexError, ValueError), e:
        return None
    if isinstance(item, str):
        if len(item.strip()) == 0:
            return None
    if func is not None:
        item = func(item)
    return item

def _valid_template(template, html, link):
    dom = fromstring(html)
    title = _get_item(dom, template['title'])
    if title is None or len(title) == 0:
        return False
    content = _get_item(dom, template['content'])
    if content is None:
        return False
    return True

def _get_all_templates(link, db):
    domains = get_fuzzy_domains(link)
    templates = []
    for domain in domains:
        cursor = db.newsTemplates.find({'domain': domain})
        for c in cursor:
            templates.append(c)
    return templates

def _get_template(link, index, db):
    f = open('urls/%s.html' % index, 'r')
    html = f.read()
    f.close()

    # decode
    html1, _ = decode(link, {'Content-Type': None}, html)
    html = html1 or html

    templates = _get_all_templates(link, db)
    for template in templates:
        if _valid_template(template, html, link):
            return template
    return None

def main():
    con = pymongo.Connection('60.191.57.163', 37017)
    db = con['weibometa']

    f = open('news_urls.txt', 'r')
    templates = []
    index = 0
    for link in f:
        template = _get_template(link, index, db)
        index += 1
        if template is None:
            print 'get template failed for %s' % link
            continue
        templates.append(template)
    f.close()

    f = open('news_result.txt', 'w')
    for template in templates:
        del template['_id']
        f.write('%s\n' % simplejson.dumps(template))
    f.close()

if __name__ == '__main__':
    main()
