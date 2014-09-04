'''
Created on: Sep 03, 2014

@author: qwang
'''
import sys
import pymongo
from urlparse import urlparse

_DOMAIN_BLACKLIST = ['api.3g.ifeng.com']

def main():
    con = pymongo.Connection('60.191.57.163', 37017)
    db = con['weibometa']

    count = int(sys.argv[1])

    limit = count if count <= 100 else 100
    all_count = 0
    links = []
    domains = {}
    while True:
        cursor = db.link.find({'success': True}, sort=[('_id', -1)], limit=limit)
        for c in cursor:
            link = c['link']
            domain = urlparse(link).netloc
            if domain in _DOMAIN_BLACKLIST:
                continue
            if domain in domains:
                continue
            domains[domain] = True
            links.append(link)
            all_count += 1
            if all_count >= count:
                break
        if all_count >= count:
            break
    for link in links:
        print link

if __name__ == '__main__':
    main()
