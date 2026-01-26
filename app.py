import os
from dotenv import load_dotenv
load_dotenv()

from mysql.connector import pooling
db_config={
  'host':"localhost",
  'user':"root",
  'password':os.getenv("DB_PASSWORD"),
  'database':"travel"
}
cnxpool= pooling.MySQLConnectionPool(pool_name = "travel_pool", pool_size = 20, autocommit=True, **db_config)
print("database ready")

import datetime
import random
import requests as remote_requests

from fastapi import * 
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
import jwt
import datetime
from datetime import timezone
app=FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")

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
@app.get("/membership", include_in_schema=False)
async def membership(request: Request):
	return FileResponse("./static/membership.html", media_type="text/html")


@app.post("/api/user")
async def signup(body: dict = Body(...)):

    name=body["name"]
    email=body["email"].lower()
    password=body["password"]

    con= cnxpool.get_connection()
    cursor = con.cursor(dictionary=True)
    cursor.execute("SELECT * FROM member WHERE email=%s",[email])
    result=cursor.fetchone()
    try:
        if result==None:
            cursor.execute("INSERT INTO member (name,email,password) VALUES (%s,%s,%s)",[name,email,password])
            con.commit()
            return{"ok":True}
        else:
            return JSONResponse(
				status_code=400,
				content={
					"error": True,
					"message": "註冊失敗，重複的 Email 或其他原因"
				}
			)
    except Exception as e:
            return JSONResponse(
				status_code=500,
				content={
					"error": True,
					"message": "伺服器內部錯誤"
				}
			)
    finally:
         cursor.close()
         con.close()
         
@app.get("/api/user/auth")
async def checkLoginStatus(request:Request):
    bearerToken = request.headers.get("Authorization")
    if bearerToken:
        try:
            token = bearerToken.split(" ")

            payload = jwt.decode(token[1], os.getenv("SECRET_PASSWORD"), algorithms=["HS256"])
            return {
                    "data": {
                        "id": payload["id"],
                        "name": payload["name"],
                        "email": payload["email"]
                    }
                }
        except(jwt.ExpiredSignatureError, jwt.InvalidTokenError):
            return {"data": None}

    else:
        return {"data": None}

@app.put("/api/user/auth")
async def login(request:Request,body: dict = Body(...)):
    
    email=body["email"]
    password=body["password"]

    con= cnxpool.get_connection()
    cursor=con.cursor()
    cursor.execute("SELECT * FROM member WHERE email=%s AND password=%s",[email,password])
    result=cursor.fetchone()

    try:
        if result:
            payload={"id":result[0],"name":result[1],"email":result[2], "exp": datetime.datetime.now(tz=timezone.utc) + datetime.timedelta(days=7)}
            token = jwt.encode(payload, os.getenv("SECRET_PASSWORD"), algorithm='HS256')
            return {"token": token}
        
        else:
                return JSONResponse(
                    status_code=400,
                    content={
                        "error": True,
                        "message": "登入失敗，帳號或密碼錯誤或其他原因"
                    }
                )
        
    
    except Exception as e:
            return JSONResponse(
				status_code=500,
				content={
					"error": True,
					"message": "伺服器內部錯誤"
				}
			)
    finally:
         cursor.close()
         con.close()


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
        con= cnxpool.get_connection()
        cursor=con.cursor(dictionary=True)
        cursor.execute(sql_query, params)
        result = cursor.fetchall()
        cursor.close()
        con.close()
        
        page_size = 8
        limit_count = page_size + 1

        if len(result) == limit_count:
            nextPage = page + 1
            data_to_return = result[:page_size] # 只回傳前 8 筆
        else:
            nextPage = None
            data_to_return = result

        all_result=[]
        if data_to_return:
            for data in data_to_return:
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
            return {"nextPage":nextPage,"data": all_result}
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
        con= cnxpool.get_connection()
        cursor=con.cursor(dictionary=True)
        cursor.execute("SELECT attraction.attraction_id,attraction.name,attraction.category_id, categories.category, attraction.description,attraction.address,attraction.transport,attraction.mrt_id,mrt.mrt_name,attraction.latitude,attraction.longitude,attraction.images FROM attraction inner join mrt on mrt.id = attraction.mrt_id inner join categories on categories.id = attraction.category_id WHERE attraction_id = %s",[attractionId])
        result=cursor.fetchone()
        cursor.close()
        con.close()
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
        con= cnxpool.get_connection()
        cursor=con.cursor()
        cursor.execute("SELECT DISTINCT categories.category FROM attraction INNER JOIN categories on categories.id=attraction.category_id")
        results = cursor.fetchall()
        cursor.close()
        con.close()
        
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
        con= cnxpool.get_connection()
        cursor=con.cursor()
        cursor.execute("SELECT mrt.mrt_name, COUNT(attraction.mrt_id) AS attraction_count FROM attraction INNER JOIN mrt on mrt.id=attraction.mrt_id GROUP BY attraction.mrt_id ORDER by attraction_count DESC")
        results = cursor.fetchall()
        cursor.close()
        con.close()
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
    
@app.get("/api/booking")
async def get_booking_info(request: Request):
    bearerToken = request.headers.get("Authorization")
    if not bearerToken:
        return JSONResponse(
				status_code=403,
				content={
					"error": True,
					"message": "未登入系統，拒絕存取"})
    
    if bearerToken:
        token = bearerToken.split(" ")

        payload = jwt.decode(token[1], os.getenv("SECRET_PASSWORD"), algorithms=["HS256"])
        id = payload["id"]

    con= cnxpool.get_connection()
    cursor=con.cursor(dictionary=True)
    cursor.execute(" select attraction.attraction_id, attraction.name, attraction.address, attraction.images, booking.attractionId, booking.booking_date, booking.booking_time, booking.price from booking inner join attraction on booking.attractionId = attraction.attraction_id Where booking.member_id = %s",[id])
    result=cursor.fetchone()
    cursor.close()
    con.close()
    if result:
            images_list=[]
            if result.get('images'):
                  for img in result['images'].split('||'):
                        if img.strip():
                              images_list.append(img.strip())
            return {"data":{
					"id": result['attractionId'],
					"name": result['name'],
					"address": result['address'],
					"images": images_list[0]},"date":result['booking_date'],"time":result['booking_time'],"price":result['price']}
    else:
         return {"data": None}
     
     
@app.post("/api/booking")
async def save_booking_info(request: Request,body: dict = Body(...)):

    bearerToken = request.headers.get("Authorization")
    if not bearerToken:
        return JSONResponse(
				status_code=403,
				content={
					"error": True,
					"message": "未登入系統，拒絕存取"})

    if bearerToken:
        token = bearerToken.split(" ")

        payload = jwt.decode(token[1], os.getenv("SECRET_PASSWORD"), algorithms=["HS256"])
        id = payload["id"]

    attractionId=body["attractionId"]
    date=body["date"]
    time=body["time"]
    price=body["price"]

    if not all([attractionId, date, time, price]):
            return JSONResponse(
                status_code=400,
                content={"error": True, "message": "建立失敗，輸入不正確或其他原因"}
            )

    try:
        con= cnxpool.get_connection()
        cursor = con.cursor(dictionary=True)
        cursor.execute("INSERT INTO booking (attractionId, member_id, booking_date, booking_time, price) VALUES (%s, %s, %s, %s, %s) ON DUPLICATE KEY UPDATE attractionId = VALUES(attractionId), booking_date = VALUES(booking_date),booking_time = VALUES(booking_time),price = VALUES(price)",[attractionId, id, date, time, price])
        con.commit()
        return{"ok":True}
    
    except jwt.PyJWTError:
        return JSONResponse(
            status_code=403,
            content={"error": True, "message": "未登入系統，拒絕存取"}
        )
    
    except Exception as e:
            return JSONResponse(
				status_code=500,
				content={
					"error": True,
					"message": "伺服器內部錯誤"
				}
			)
    finally:
         cursor.close()
         con.close()
     
     
@app.delete("/api/booking")
async def delete_booking(request: Request):
    bearerToken = request.headers.get("Authorization")
    if not bearerToken:
        return JSONResponse(
				status_code=403,
				content={
					"error": True,
					"message": "未登入系統，拒絕存取"})

    if bearerToken:
        token = bearerToken.split(" ")
        payload = jwt.decode(token[1], os.getenv("SECRET_PASSWORD"), algorithms=["HS256"])
        id = payload["id"]

    try:
        con= cnxpool.get_connection()
        cursor = con.cursor(dictionary=True)
        cursor.execute("DELETE FROM booking WHERE member_id=%s",[id])
        con.commit() 
        cursor.close()
        con.close()
        return {"ok":True}
        
    except jwt.PyJWTError: 
        return JSONResponse(
            status_code=403,
            content={"error": True, "message": "未登入系統，拒絕存取"}
        )
    

@app.post("/api/orders")
async def save_booking_info(request: Request,body: dict = Body(...)):
    #order
    now = datetime.datetime.now()
    time_part = now.strftime("%Y%m%d%H%M%S")
    
    random_part = str(random.randint(1000, 9999))
    number = time_part + random_part

    bearerToken = request.headers.get("Authorization")
    if not bearerToken:
        return JSONResponse(
				status_code=403,
				content={
					"error": True,
					"message": "未登入系統，拒絕存取"})

    if bearerToken:
        token = bearerToken.split(" ")

        payload = jwt.decode(token[1], os.getenv("SECRET_PASSWORD"), algorithms=["HS256"])
        id = payload["id"]
    
    try:
        prime=body["prime"]
        attractionId=body["attraction"]
        date=body["date"]
        time=body["time"]
        price=body["price"]
        name=body["name"]
        email=body["email"] 
        phone=body["phone"]

        if not all([number, id, price, attractionId, date, time, name, email, phone]):
                return JSONResponse(
                    status_code=400,
                    content={"error": True, "message": "建立失敗，輸入不正確或其他原因"}
                )
        con= cnxpool.get_connection()
        cursor = con.cursor(dictionary=True)
        order_sql = """
                INSERT INTO orders (number, member_id, price, attraction_id, date, time, 
                                contact_name, contact_email, contact_phone, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 1)
            """
        cursor.execute(order_sql, [number, id, price, attractionId, date, time, name, email, phone])
        con.commit()
        

        tappay_url ="https://sandbox.tappaysdk.com/tpc/payment/pay-by-prime"
        tappay_header={
        "Content-Type": "application/json",
        "x-api-key": os.getenv("PARTNER_KEY")}
        tappay_info={
        "prime": prime,
        "partner_key": os.getenv("PARTNER_KEY"),
        "merchant_id": os.getenv("MARCHANT_ID"),
        "details": f"台北一日遊-[{number}]",
        "amount": price,
        "cardholder": {
            "phone_number": phone,
            "name": name,
            "email":email
        },
        "remember": False
        }
        tp_response = remote_requests.post(tappay_url, headers=tappay_header, json=tappay_info)
        tp_result = tp_response.json()

        tp_status = tp_result.get("status")
        tp_msg = tp_result.get("msg")
        card_info = tp_result.get("card_info", {})
        last_four = card_info.get("last_four")
        amount=tp_result.get("amount")
        currency=tp_result.get("currency")
        rec_trade_id = tp_result.get("rec_trade_id")
        print([number, tp_status, tp_msg, rec_trade_id, last_four, amount, currency])

        if not all([number, tp_msg, rec_trade_id, last_four, amount, currency]):
                return JSONResponse(
                    status_code=400,
                    content={"error": True, "message": "建立失敗，輸入不正確或其他原因"}
                )
       
        payment_sql = """
                INSERT INTO payments (order_number, status, msg, rec_trade_id,card_last_four, amount,currency)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """
        cursor.execute(payment_sql, [number, tp_status, tp_msg, rec_trade_id, last_four, amount, currency])
        
        if tp_status == 0:
                cursor.execute("UPDATE orders SET status = 0 WHERE number = %s", [number])
                
                cursor.execute("DELETE FROM booking WHERE member_id=%s",[id])
                con.commit() 
                cursor.close()
            
                return {
                    "data": {
                        "number": number,
                        "payment": {"status": 0, "message": "付款成功"}
                    }
                }
        else:
                con.commit()
                return {
                    "data": {
                        "number": number,
                        "payment": {"status": tp_status, "message": "付款失敗"}
                    }
                }
    
    except jwt.PyJWTError:
        return JSONResponse(
            status_code=403,
            content={"error": True, "message": "未登入系統，拒絕存取"}
        )
    
    except Exception as e:
            print(f"後端發生錯誤：{e}")
            return JSONResponse(
				status_code=500,
				content={
					"error": True,
					"message": "伺服器內部錯誤"
				}
			)
    finally:
         cursor.close()
         con.close()
    
@app.get("/api/order/{orderNumber}")
async def get_booking_info(request: Request, orderNumber: str):
    bearerToken = request.headers.get("Authorization")
    if not bearerToken:
        return JSONResponse(status_code=403,
				content={
					"error": True,
					"message": "未登入系統，拒絕存取"})
    if bearerToken:
        token = bearerToken.split(" ")
        payload = jwt.decode(token[1], os.getenv("SECRET_PASSWORD"), algorithms=["HS256"])
        id = payload["id"]

    con= cnxpool.get_connection()
    cursor=con.cursor(dictionary=True)
    cursor.execute("select orders.number, orders.member_id, orders.price, orders.attraction_id, orders.date, orders.time, orders.contact_name, orders.contact_email,orders.contact_phone, orders.status, attraction.attraction_id,attraction.name, attraction.address, attraction.images from orders inner join attraction on orders.attraction_id = attraction.attraction_id Where orders.number = %s",[str(orderNumber)])
    result=cursor.fetchone()
    cursor.close()
    con.close()
    if result:
            images_list=[]
            if result.get('images'):
                  for img in result['images'].split('||'):
                        if img.strip():
                              images_list.append(img.strip())

            return {"data": {
                        "number": result['number'],
                        "price": result['price'],
                        "trip": {
                        "attraction": {
                            "id": result['attraction_id'],
                            "name": result['name'],
                            "address": result['address'],
                            "image": images_list[0]
                        },
                        "date": result['date'],
                        "time": result['time']
                        },
                        "contact": {
                        "name": result['contact_name'],
                        "email": result['contact_email'],
                        "phone": result['contact_phone']
                        },
                        "status": result['status']
                    }
            }
            
    else:
         return {"data": None}
    
@app.get("/api/membership")
async def get_membership_info(request: Request):
    bearerToken = request.headers.get("Authorization")
    if not bearerToken:
        return JSONResponse(
				status_code=403,
				content={
					"error": True,
					"message": "未登入系統，拒絕存取"})

    if bearerToken:
        token = bearerToken.split(" ")
        payload = jwt.decode(token[1], os.getenv("SECRET_PASSWORD"), algorithms=["HS256"])
        id = payload["id"]

    con= cnxpool.get_connection()
    cursor=con.cursor(dictionary=True)
    cursor.execute("select * from member Where id = %s",[id])
    result=cursor.fetchone()
    cursor.close()
    con.close()
    if result:
         return {"data": {
                     "id": result['id'],
                     "name": result['name'],
                     "email": result['email'],
                     "password": result['password'],
                     "photo":result['photo']
                    }}
                    
@app.patch("/api/user/avatar")
async def update_user_avatar(request: Request, file: UploadFile = File(...)):

    bearerToken = request.headers.get("Authorization")
    if not bearerToken:
        return JSONResponse(status_code=403, content={"error": True, "message": "未登入系統"})

    try:
        token = bearerToken.split(" ")[1]
        payload = jwt.decode(token, os.getenv("SECRET_PASSWORD"), algorithms=["HS256"])
        user_id = payload["id"]

        # 2. 儲存實體檔案
        upload_dir = "static/uploads"
        if not os.path.exists(upload_dir):
            os.makedirs(upload_dir)
        
        # 建議重新命名檔案，避免中文或特殊字元導致讀取失敗
        file_extension = file.filename.split(".")[-1]
        new_filename = f"avatar_{user_id}.{file_extension}"
        file_path = os.path.join(upload_dir, new_filename)

        with open(file_path, "wb") as f:
            content = await file.read() # 讀取檔案流
            f.write(content)

        # 3. 更新資料庫路徑
        con = cnxpool.get_connection()
        cursor = con.cursor()
        photo_url = f"/static/uploads/{new_filename}"
        cursor.execute("UPDATE member SET photo = %s WHERE id = %s", [photo_url, user_id])
        con.commit()
        
        cursor.close()
        con.close()
        
        return {"ok": True, "photoUrl": photo_url}

    except Exception as e:
        print(f"上傳發生錯誤：{e}")
        return JSONResponse(status_code=500, content={"error": True, "message": "伺服器內部錯誤"})
    


@app.patch("/api/user/name")
async def update_name(request: Request, body: dict = Body(...)):
    bearerToken = request.headers.get("Authorization")
    if not bearerToken:
        return JSONResponse(
				status_code=403,
				content={
					"error": True,
					"message": "未登入系統，拒絕存取"})

    if bearerToken:
        token = bearerToken.split(" ")
        payload = jwt.decode(token[1], os.getenv("SECRET_PASSWORD"), algorithms=["HS256"])
        id = payload["id"]

    try:
        name=body["name"]
        
        con= cnxpool.get_connection()
        cursor=con.cursor(dictionary=True)
        cursor.execute("UPDATE member SET name = %s WHERE id = %s",[name,id])
        con.commit()
        cursor.close()
        con.close()
        return {"ok": True}
    
    except jwt.PyJWTError:
        return JSONResponse(
            status_code=403,
            content={"error": True, "message": "未登入系統，拒絕存取"}
        )
    
    except Exception as e:
            print(f"後端發生錯誤：{e}")
            return JSONResponse(
				status_code=500,
				content={
					"error": True,
					"message": "伺服器內部錯誤"
				}
			)
    
@app.patch("/api/user/password")
async def update_password(request: Request, body: dict = Body(...)):
    bearerToken = request.headers.get("Authorization")
    if not bearerToken:
        return JSONResponse(status_code=403, content={"error": True, "message": "未登入系統，拒絕存取"})

    try:
        token = bearerToken.split(" ")[1]
        payload = jwt.decode(token, os.getenv("SECRET_PASSWORD"), algorithms=["HS256"])
        user_id = payload["id"]

        old_password = body.get("oldpassword")
        new_password = body.get("newpassword")

        con = cnxpool.get_connection()
        cursor = con.cursor(dictionary=True)
        
        try:
            cursor.execute("SELECT password FROM member WHERE id = %s", [user_id])
            result = cursor.fetchone()

            if result["password"] == old_password:
                cursor.execute("UPDATE member SET password = %s WHERE id = %s", [new_password, user_id])
                con.commit()
                return {"ok": True}
            else:
                return JSONResponse(status_code=400, content={"error": True, "message": "舊密碼不正確"})
        
        finally:
            cursor.close()
            con.close()

    except jwt.PyJWTError:
        return JSONResponse(status_code=403, content={"error": True, "message": "認證無效，請重新登入"})
    except Exception as e:
        print(f"後端發生錯誤：{e}")
        return JSONResponse(status_code=500, content={"error": True, "message": "伺服器內部錯誤"})
    
@app.get("/api/orders")
async def get_orders_info(request: Request):
    bearerToken = request.headers.get("Authorization")
    if not bearerToken:
        return JSONResponse(status_code=403,
				content={
					"error": True,
					"message": "未登入系統，拒絕存取"})
    if bearerToken:
        token = bearerToken.split(" ")
        payload = jwt.decode(token[1], os.getenv("SECRET_PASSWORD"), algorithms=["HS256"])
        id = payload["id"]

    con= cnxpool.get_connection()
    cursor=con.cursor(dictionary=True)
    cursor.execute("select orders.number, orders.member_id, orders.price, orders.attraction_id, orders.date, orders.time, orders.contact_name, orders.contact_email,orders.contact_phone, orders.status, attraction.attraction_id,attraction.name, attraction.address, attraction.images from orders inner join attraction on orders.attraction_id = attraction.attraction_id Where orders.member_id = %s",[id])
    result=cursor.fetchall()
    cursor.close()
    con.close()
    
    all_result=[]
    if result:
        for row in result:
                images_list=[]
                if row.get('images'):
                    for img in row['images'].split('||'):
                            if img.strip():
                                images_list.append(img.strip())

                order_data = {
                    "number": row['number'],
                    "price": row['price'],
                    "trip": {
                        "attraction": {
                            "id": row['attraction_id'],
                            "name": row['name'],
                            "address": row['address'],
                            "image": images_list[0] 
                        },
                        "date": row['date'],
                        "time": row['time']
                    },
                    "contact": {
                        "name": row['contact_name'],
                        "email": row['contact_email'],
                        "phone": row['contact_phone']
                    },
                    "status": row['status']
                }
                all_result.append(order_data)
            
        return {"data": all_result}
            
    else:
        return {"data": None}