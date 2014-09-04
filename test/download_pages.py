import os
import sys
import urllib2
import cStringIO
import gzip
import re
import chardet
import codecs
from BeautifulSoup import BeautifulSoup

_CONTENT_TYPE_META_REG_= re.compile('<(\s*)meta([^>]+)charset=(\"?)([^>]+?)([;\'\">])', re.I)

def _get_encoding_from_header(headers, body):
    content_type = headers['Content-Type']
    if content_type is not None and (isinstance(content_type, str) or isinstance(content_type, unicode)):
        charset=BeautifulSoup.CHARSET_RE.search(content_type)
    else:
        charset = None
    return charset and charset.group(3) or None

def _get_encoding_from_meta(headers, body):
    match=_CONTENT_TYPE_META_REG_.search(body[0:1024])
    if match is not None:
        encoding = match.group(4).strip().lower()
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
        print "try decode failed ", encode, url
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
                print "decoding failed for url ", url
                return None, None
        html = _try_decode(url, body, encoding)
        if html is not None:
            return html, encoding
        else:
            try_count += 1
            encoding = None

def load_body(url, encoding=None):
    try:
        req = urllib2.Request(url)
        req.add_header('User-Agent', "Mozilla/5.0 (X11; U; Linux x86_64; en-US; rv:1.9.2.10) Gecko/20100922 Ubuntu/10.10 (maverick) Firefox/3.6.10")
        req.add_header('Accept', 'text/html,application/xhtml+xml')
        response=urllib2.urlopen(req, timeout=3)
        ce=response.headers.get('Content-Encoding',None)
        if ce and ce.lower().find('gzip')!=-1:
            body=cStringIO.StringIO(response.read())
            body=gzip.GzipFile(fileobj=body,mode='rb').read()
        else:
            body = response.read()
        content_type = response.headers.get('Content-Type',None)
        body, _ = decode(url,{'Content-Type':content_type},body, encoding=encoding)
        return body
    except Exception as e:
        print url, e
        return None

def process_file(filename, start, end, func):
    with open(filename, "r") as f:
        index = 0
        for line in f:
            if start >= 0 and end > start:
                if index < start or index >= end:
                    index += 1
                    continue

            if len(line) > 0 and line[-1] == '\r':
                line = line[:-1]
            if len(line) > 0 and line[-1] == '\n':
                line = line[:-1]
            func(line, index)
            index += 1

failed_count = 0

def proc_line(line, index):
    global failed_count
    cols = line.split(' ')
    url = cols[0]
    if (url.endswith(".jpg") or url.endswith(".apk")):
        body = u""
    else:
        body = load_body(url)

    if body is None:
        body = u""

    body = body.encode("utf-8", "ignore")

    body = re.sub(_CONTENT_TYPE_META_REG_, r'<\1meta\2charset=\3utf-8\5', body)

    if body is None or len(body) == 0:
        failed_count+=1

    with open(sys.argv[3] % index, "w") as f:
        f.write(body)
    print "downloaded ", line, "with size ", len(body)

if sys.argv[1] == "single":
    process_file(sys.argv[2], int(sys.argv[4]), int(sys.argv[5]), proc_line)
    print "failed_count:", failed_count
elif sys.argv[1] == "multi":
    url_file = sys.argv[2]
    segment_count = int(sys.argv[4])
    multi_count = int(sys.argv[5])
    start_index = int(sys.argv[6])

    for i in range(multi_count):
        os.system("python download_pages.py single %s %s %d %d &" % (sys.argv[2], sys.argv[3], start_index + i * segment_count, start_index + (i + 1) * segment_count))
elif sys.argv[1] == "one":
    url = sys.argv[2]
    body = load_body(url)
    if body is None:
        body = u""
    body = body.encode("utf-8", "ignore")
    with open(sys.argv[3], "w") as f:
        f.write(body)
    print len(body)
