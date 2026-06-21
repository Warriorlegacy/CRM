from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import KeepInFrame, Paragraph, SimpleDocTemplate, Spacer


ROOT = Path(r"D:\CRM\whatsapp-crm")
OUTPUT = ROOT / "output" / "pdf" / "whatsapp-crm-app-summary.pdf"


def bullet_items(items, style):
    return [Paragraph(f'&bull; {item}', style) for item in items]


def build_story():
    styles = getSampleStyleSheet()
    title = ParagraphStyle(
        "Title",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=18,
        leading=21,
        textColor=colors.HexColor("#0F172A"),
        alignment=TA_LEFT,
        spaceAfter=8,
    )
    subtitle = ParagraphStyle(
        "Subtitle",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=10.5,
        textColor=colors.HexColor("#475569"),
        spaceAfter=8,
    )
    section = ParagraphStyle(
        "Section",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=10.5,
        leading=12.5,
        textColor=colors.HexColor("#0F766E"),
        spaceBefore=4,
        spaceAfter=3,
    )
    body = ParagraphStyle(
        "Body",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=8.8,
        leading=11.1,
        textColor=colors.HexColor("#111827"),
        spaceAfter=2,
    )
    bullet = ParagraphStyle(
        "Bullet",
        parent=body,
        leftIndent=10,
        firstLineIndent=-7,
        spaceAfter=1.3,
    )
    code = ParagraphStyle(
        "Code",
        parent=body,
        fontName="Helvetica-Oblique",
        fontSize=8.2,
        leading=10.2,
        leftIndent=10,
        textColor=colors.HexColor("#1F2937"),
        spaceAfter=1.2,
    )

    features = [
        "Shared team inbox for WhatsApp conversations, with inbox, contacts, dashboard, pipeline, follow-ups, templates, team, settings, and webhooks UI routes.",
        "Workspace and user authentication flows, including register, login, token refresh, current-user, workspace membership, and invite endpoints.",
        "Contact and conversation management backed by PostgreSQL models for contacts, conversations, messages, assignments, stages, and unread counts.",
        "Follow-up scheduling plus template management for repeatable replies and lead progression.",
        "Real-time updates over Server-Sent Events so workspace activity can stream into the frontend.",
        "WhatsApp webhook ingestion that creates or updates contacts, conversations, and inbound messages, then can trigger autoresponders.",
        "Additional API surfaces for analytics, export, broadcast, media, activity, search, and webhook logs.",
    ]

    architecture = [
        "Frontend: Next.js app with an `AppShell` layout (`Sidebar` + `Topbar`) and authenticated workspace pages under `frontend/src/app/(app)`.",
        "Backend: Express server mounts public health, webhook, and auth routes, then JWT-protected `/api/v1/*` business routes plus protected `/realtime/events` SSE.",
        "Data: Prisma models persist users, workspaces, WhatsApp accounts, contacts, conversations, messages, follow-ups, templates, autoresponders, and webhook logs in PostgreSQL.",
        "Flow: Meta webhook -> `handleWhatsAppWebhook` -> Prisma upserts/message create -> publish workspace event -> frontend subscribes via `EventSource` using `NEXT_PUBLIC_API_URL`.",
        "Infra in repo: Docker Compose defines PostgreSQL, optional Redis, backend, frontend, and optional Nginx reverse proxy.",
    ]

    run_steps = [
        "Backend: `cd backend`, `npm install`, copy `.env.example` to `.env`, set `DATABASE_URL`, `WA_VERIFY_TOKEN`, and `JWT_SECRET`, then run `npx prisma migrate dev`, `npx prisma generate`, `npx prisma db seed`, `npm run dev`.",
        "Frontend: `cd frontend`, `npm install`, copy `.env.example` to `.env.local`, set `NEXT_PUBLIC_API_URL=http://localhost:3001`, then run `npm run dev`.",
        "Endpoints from repo docs: frontend on `http://localhost:3000`, backend on `http://localhost:3001`. Meta credentials are required for live WhatsApp integration.",
    ]

    story = [
        Paragraph("WhatsApp CRM App Summary", title),
        Paragraph(
            "Repo-based one-page overview of the application in `D:\\CRM\\whatsapp-crm`.",
            subtitle,
        ),
        Paragraph("What It Is", section),
        Paragraph(
            "A B2B SaaS web app that turns a shared WhatsApp number into a sales and support CRM. "
            "Repo docs and code show a Next.js frontend, an Express API, PostgreSQL via Prisma, and WhatsApp webhook plus real-time event handling.",
            body,
        ),
        Paragraph("Who It's For", section),
        Paragraph(
            "Primary persona: sales or support teams that need shared ownership, pipeline visibility, and faster follow-up for WhatsApp conversations.",
            body,
        ),
        Paragraph("What It Does", section),
    ]

    story.extend(bullet_items(features, bullet))
    story.extend(
        [
            Paragraph("How It Works", section),
            *bullet_items(architecture, bullet),
            Paragraph("How to Run", section),
            *bullet_items(run_steps, code),
            Spacer(1, 0.08 * inch),
            Paragraph(
                "Not found in repo: a complete production-ready local `.env` sample with all optional variables populated.",
                subtitle,
            ),
        ]
    )
    return story


def main():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(
        str(OUTPUT),
        pagesize=letter,
        leftMargin=0.58 * inch,
        rightMargin=0.58 * inch,
        topMargin=0.5 * inch,
        bottomMargin=0.45 * inch,
        title="WhatsApp CRM App Summary",
        author="OpenAI Codex",
    )
    frame_width = letter[0] - doc.leftMargin - doc.rightMargin
    frame_height = letter[1] - doc.topMargin - doc.bottomMargin
    content = KeepInFrame(frame_width, frame_height, build_story(), mode="shrink")
    doc.build([content])
    print(OUTPUT)


if __name__ == "__main__":
    main()
