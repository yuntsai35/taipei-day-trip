import os
from dotenv import load_dotenv
load_dotenv()

import mysql.connector
con = mysql.connector.connect(
  host="localhost",
  user="root",
  password=os.getenv("DB_PASSWORD"),
  database="travel"
)
print("database ready")

from fastapi import *
from fastapi.responses import FileResponse
app=FastAPI()

# Static Pages (Never Modify Code in this Block)
@app.get("/", include_in_schema=False)
async def index(request: Request):
	return FileResponse("./static/index.html", media_type="text/html")
@app.get("/attraction/{id}", include_in_schema=False)
async def attraction(request: Request, id: int):
	return FileResponse("./static/attraction.html", media_type="text/html")
@app.get("/booking", include_in_schema=False)
async def booking(request: Request):
	return FileResponse("./static/booking.html", media_type="text/html")
@app.get("/thankyou", include_in_schema=False)
async def thankyou(request: Request):
	return FileResponse("./static/thankyou.html", media_type="text/html")

@app.get("/api/attractions")
async def attraction(request: Request,page:int=0,category:str|None=None, keyword:str|None=None):
    

    sql_base="SELECT attraction.attraction_id,attraction.name,attraction.category_id, categories.category, attraction.description,attraction.address,attraction.transport,attraction.mrt_id,mrt.mrt_name,attraction.latitude,attraction.longitude,attraction.images FROM attraction inner join mrt on mrt.id = attraction.mrt_id inner join categories on categories.id = attraction.category_id "
    
    sql_order = " ORDER BY attraction.attraction_id ASC"
    
    page_size = 8
    limit_count = page_size + 1 
    offset = page * page_size
    
    where_conditions = []
    params = []

    if category is not None:
       where_conditions.append("categories.category = %s")
       params.append(category)

    if keyword is not None:

       keyword_condition = "(mrt.mrt_name = %s OR attraction.name LIKE %s)"
       where_conditions.append(keyword_condition)
       
       keyword_fuzzy_param = "%" + keyword + "%"
       
       params.extend([keyword, keyword_fuzzy_param]) 

    if where_conditions:
        sql_query = sql_base + "WHERE " + " AND ".join(where_conditions) + sql_order
    else:
        sql_query = sql_base + sql_order
        
    sql_query += " LIMIT %s OFFSET %s"
    
    params.extend([limit_count, offset])
         

    try:
        cursor=con.cursor(dictionary=True)
        cursor.execute(sql_query, params)
        result = cursor.fetchall()
        cursor.close()
        
        if len(result) == limit_count:
            next_page = page + 1
            data_to_return = result[:page_size] # 只回傳前 8 筆
        else:
            next_page = None
            data_to_return = result

        all_result=[]
        if data_to_return:
            for data in result:
                images_list=[]
                if data.get('images'): 
                    for img in data['images'].split('||'):
                       if img.strip():
                            images_list.append(img.strip())
                member_data = {
					"id": data['attraction_id'],
					"name": data['name'],
					"category": data['category'],
					"description": data['description'],
					"address": data['address'],
					"transport": data['transport'],
					"mrt": data['mrt_name'],
					"lat": data['latitude'],
					"lng": data['longitude'],
					"images": images_list,
				}
                all_result.append(member_data)
            return {"next page":next_page,"data": all_result}
        else:
            return {"nextPage": None,"data": []}
    except HTTPException:
            raise HTTPException(
				status_code=500,
				detail={
					"error": True,
					"message": "請依照情境提供對應的錯誤訊息"
				}
			)
      

@app.get("/api/attraction/{attractionId}")
async def attraction(request: Request, attractionId: int):
    try:
        cursor=con.cursor(dictionary=True)
        cursor.execute("SELECT attraction.attraction_id,attraction.name,attraction.category_id, categories.category, attraction.description,attraction.address,attraction.transport,attraction.mrt_id,mrt.mrt_name,attraction.latitude,attraction.longitude,attraction.images FROM attraction inner join mrt on mrt.id = attraction.mrt_id inner join categories on categories.id = attraction.category_id WHERE attraction_id = %s",[attractionId])
        result=cursor.fetchone()
        cursor.close()
        if result:
            images_list=[]
            if result.get('images'):
                  for img in result['images'].split('||'):
                        if img.strip():
                              images_list.append(img.strip())
            member_data = {
					"id": result['attraction_id'],
					"name": result['name'],
					"category": result['category'],
					"description": result['description'],
					"address": result['address'],
					"transport": result['transport'],
					"mrt": result['mrt_name'],
					"lat": result['latitude'],
					"lng": result['longitude'],
					"images": images_list,
				}
            return {"data": member_data}
        else:
            raise HTTPException(
				status_code=400,
				detail={
					"error": True,
					"message": "請依照情境提供對應的錯誤訊息"
				}
			)
    except HTTPException as e:
        raise e
    
    except HTTPException:
            raise HTTPException(
				status_code=500,
				detail={
					"error": True,
					"message": "請依照情境提供對應的錯誤訊息"
				}
			)

@app.get("/api/categories")
async def attraction(request: Request):
    try:
        cursor=con.cursor()
        cursor.execute("SELECT DISTINCT categories.category FROM attraction INNER JOIN categories on categories.id=attraction.category_id")
        results = cursor.fetchall()
        cursor.close()
        
        category_list = []
        for row in results:
              category_list.append(row[0])
        
        return {"data": category_list}
    except HTTPException:
            raise HTTPException(
				status_code=500,
				detail={
					"error": True,
					"message": "請依照情境提供對應的錯誤訊息"
				}
			)
    
@app.get("/api/mrts")
async def attraction(request: Request):
    try:
        cursor=con.cursor()
        cursor.execute("SELECT mrt.mrt_name, COUNT(attraction.mrt_id) AS attraction_count FROM attraction INNER JOIN mrt on mrt.id=attraction.mrt_id GROUP BY attraction.mrt_id ORDER by attraction_count DESC")
        results = cursor.fetchall()
        cursor.close()
        mrt_list = [row[0] for row in results]
        return {"data": mrt_list}
    except HTTPException:
            raise HTTPException(
				status_code=500,
				detail={
					"error": True,
					"message": "請依照情境提供對應的錯誤訊息"
				}
			)