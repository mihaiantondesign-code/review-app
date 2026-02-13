from fastapi import APIRouter
from fastapi.responses import Response
from app.models.schemas import ExcelExportRequest, ComparisonExcelRequest
from app.services.excel import create_excel, create_comparison_excel

router = APIRouter(prefix="/api/export", tags=["export"])


@router.post("/excel")
def export_excel(req: ExcelExportRequest):
    reviews = [r.model_dump() for r in req.reviews]
    content = create_excel(reviews)
    return Response(
        content=content,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=reviews.xlsx"},
    )


@router.post("/comparison-excel")
def export_comparison_excel(req: ComparisonExcelRequest):
    apps = {k: [r.model_dump() for r in v] for k, v in req.apps.items()}
    content = create_comparison_excel(apps, req.app_names)
    return Response(
        content=content,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=comparison_reviews.xlsx"},
    )
