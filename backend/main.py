import uvicorn
from fastapi import FastAPI

import resources.API_EndPoints.pdf_upload_endpoint as pdf_upload_endpoint

app = FastAPI(title="Modüler API")

app.include_router(pdf_upload_endpoint.router)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)