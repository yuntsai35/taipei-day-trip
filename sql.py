import json
import mysql.connector

location='C:/Users/user/OneDrive/桌面/stage2/taipei-day-trip/data/taipei-attractions.json'

with open(location,'r', encoding='utf-8') as f:
    data= json.load(f)
    clist=data["result"]["results"]

con=mysql.connector.connect(
    user='root',
    password='Cdefgabc1',
    host='localhost',
    database='travel',
)

if con.is_connected():
    print("connected!")

cur=con.cursor()

mrt_set=set()
cat_set=set()

for spot in clist:
    mrt_name = spot["MRT"]
    mrt_set.add(mrt_name)
    category = spot["CAT"]
    cat_set.add(category)

for mrt in mrt_set:
    if mrt is None:
        cur.execute("SELECT id FROM mrt WHERE mrt_name IS NULL")
    else:
        cur.execute("SELECT id FROM mrt WHERE mrt_name = %s", [mrt])

    result = cur.fetchone()
    cur.fetchall()
    if result is None:
        cur.execute("INSERT INTO mrt (mrt_name) VALUES (%s)", [mrt])

for category in cat_set:
    cur.execute("SELECT id FROM categories WHERE category = %s",[category])
    if cur.fetchone() is None:
        cur.execute("INSERT INTO categories (category) VALUES (%s)",[category])

#attration 表格整理

for spot in clist:
    attraction_id=spot["_id"]
    name=spot["name"]
    category=spot["CAT"]
    description=spot["description"]
    address=spot["address"]
    transport=spot["direction"]
    mrt=spot["MRT"]
    lat=spot["latitude"]
    lng=spot["longitude"]
    image=spot["file"]
    
    cur.execute("SELECT id FROM attraction WHERE attraction_id = %s", [attraction_id])
    result = cur.fetchone()
    cur.fetchall()

    if result is None:

        cur.execute("SELECT id FROM categories WHERE category = %s", [category])
        category_id = cur.fetchone()
        cur.fetchall()

        if category_id is not None:
            category_id=int(category_id[0])
        else:
            category_id=None
            
        cur.execute("SELECT id FROM mrt WHERE mrt_name = %s", [mrt])
        mrt_id=cur.fetchone()
        cur.fetchall()

        if mrt_id is not None:
            mrt_id=int(mrt_id[0])
        else:
            mrt_id=None

        cur.execute("INSERT INTO attraction (attraction_id, name, category_id, description, address, transport, mrt_id, latitude, longitude, images ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",[attraction_id, name,category_id, description, address, transport, mrt_id, lat, lng, image])
        
for pic in clist:
    attraction_id=pic["_id"]
    image=pic["file"]
    url_list=image.split("http")
    
    image_urls=[]
    for url in url_list:
        if url !='':
            url="http"+url
            image_urls.append(url)

    filtered_images_urls = [] 
    for image in image_urls:
        if image.lower().endswith(".jpg") or image.lower().endswith(".png"):
            filtered_images_urls.append(image)
   
    filtered_images_urls = "||".join(filtered_images_urls)
    
    cur.execute("UPDATE attraction SET images=%s WHERE attraction_id=%s",[filtered_images_urls, attraction_id])

con.commit()
cur.close()
con.close()
