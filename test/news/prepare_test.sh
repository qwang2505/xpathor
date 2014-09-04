# get test urls
#python get_test_urls.py 10 >> news_urls.txt

# download pages
mkdir urls
cd .. && python download_pages.py multi news/news_urls.txt news/urls/%d.html 10 10 0

# get template result
#python get_template.py

# start test
#python test.py
