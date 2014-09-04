'''
Created on: Sep 04, 2014

@author: qwang
'''
import os
import re

_RESULT_RE = re.compile('Generate result: (success|fail)', re.I)
_RESULT_DETAIL_RE = re.compile('Generate result detail: (.*)', re.I)

def main():
    # read urls
    f = open('news_urls.txt', 'r')
    urls = map(lambda url: url.strip(), f.readlines())
    f.close()
    # call phantom test script and get result
    all_count = 0
    success_count = 0
    fail_count = 0
    failed_result = []
    for index, url in enumerate(urls):
        f = os.popen('phantomjs test_news_xpath_generate.js %s' % index)
        result = f.read().strip()
        f.close()
        all_count += 1
        m = _RESULT_RE.search(result)
        if m is None:
            fail_count += 1
            failed_result.append({'url': url, 'reason': 'unknow, phantom test return no result', 'index': index})
            continue
        status = m.group(1)
        if status == 'success':
            success_count += 1
            continue
        elif status == 'fail':
            fail_count += 1
            m = _RESULT_DETAIL_RE.search(result)
            if m is None:
                failed_result.append({'url': url, 'reason': 'unknow, phantom return no detail', 'index': index})
                continue
            reason = m.group(1)
            failed_result.append({'url': url, 'reason': reason, 'index': index})
            continue
        else:
            fail_count += 1
            failed_result.append({'url': url, 'reason': 'phantom return unknow status', 'index': index})
    f = open('failed_result.txt', 'w')
    for result in failed_result:
        f.write('%s, %s\n' % (result['index'], result['url']))
        f.write('\t%s\n' % result['reason'].replace('\t', '\n\t'))
        f.write('\n')
    f.close()
    print
    print '===== Xpath Generating Report ====='
    print 'Total Count: %s' % all_count
    print 'Success Rate: %.2f%%' % (float(success_count) / all_count * 100)
    print 'Failed result have been saved into failed_result.txt'
    print '==================================='
    print

if __name__ == '__main__':
    main()
