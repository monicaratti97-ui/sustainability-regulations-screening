# Sustainability Regulatory Screening App

## Overview

This application is a web-based screening tool designed to help organizations assess whether they are impacted by specific sustainability regulations and evaluate their level of readiness or compliance.

The platform is modular and scalable, allowing new regulations to be added over time.

In its current **MVP (Minimum Viable Product)** version, the application supports:

- **PPWR** – Packaging and Packaging Waste Regulation  
- **Battery Passport** – EU Battery Regulation digital passport requirements  
- **RED III** – Renewable Energy Directive III  

---

## Purpose

The objective of this application is to:

- Identify whether a company falls within the scope of selected sustainability regulations
- Evaluate regulatory maturity and readiness through structured questionnaires
- Provide a structured self-assessment framework
- Serve as a foundation for future compliance and regulatory intelligence tools

> This tool is intended for screening and preliminary assessment purposes only and does not replace legal advice.

---

## Application Structure

The application is built using **Next.js (App Router)** and follows a modular page-based architecture.

### 1. Homepage (`/`)

The homepage allows users to select which regulation they want to assess.

Each regulation is displayed as a selectable card.  
Clicking a card routes the user to the appropriate questionnaire.

Example navigation pattern:

- `/questionnaire?reg=PPWR`
- `/questionnaire?reg=BATTERY`
- `/questionnaire?reg=REDIII`

The architecture also supports dedicated routes such as:

- `/ppwr`
- `/battery`
- `/rediii`

---

### 2. Questionnaire Page

The questionnaire page dynamically loads the appropriate question set based on the selected regulation.

Each regulatory module contains:

- A predefined list of structured screening questions
- A standardized response model (e.g., Complete / Partial / Absent)
- Basic completion tracking logic

The system is designed so that each regulation can either:

- Be managed within a single dynamic questionnaire page, or
- Be separated into individual dedicated pages for scalability

---

## Regulatory Modules (MVP)

### PPWR – Packaging and Packaging Waste Regulation

Focus areas include:

- Scope applicability
- Eco-design principles
- Recyclability
- Recycled content
- Extended Producer Responsibility (EPR)
- Labeling requirements
- Supply chain traceability

---

### Battery Passport

Focus areas include:

- Digital battery passport requirements
- Lifecycle and traceability data
- ESG transparency
- Supply chain documentation
- Compliance reporting structure

This module can reuse an existing Battery Passport screening component if available.

---

### RED III – Renewable Energy Directive III

Focus areas include:

- Product scope applicability
- Conformity assessment procedures
- Energy efficiency measures
- Sustainability requirements
- Repairability and lifecycle considerations
- End-of-life obligations

---

## Technical Architecture

- **Framework:** Next.js (App Router)
- **Frontend:** React (Client Components)
- **Styling:** Inline styling (MVP level)
- **State Management:** Local React state
- **Backend:** Not implemented in MVP (API integration ready)

The architecture is intentionally lightweight to enable:

- Rapid addition of new regulatory modules
- Future API integration for data persistence
- Scoring and risk evaluation logic
- Dashboard and reporting features

---

## Scalability Roadmap

Planned future enhancements may include:

- Persistent storage (database integration)
- Automated scoring and risk classification
- Multi-regulation dashboard overview
- User authentication and multi-company support
- PDF / Excel export functionality
- Regulatory update tracking
- Role-based access control

---

## How to Run the Application

Install dependencies:

```bash
npm install