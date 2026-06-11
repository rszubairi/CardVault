# Business Card Relationship Manager (Working Title)

## Product Vision

Build a cross-platform React Native application that enables users to instantly digitize business cards during conferences, networking sessions, meetings, and exhibitions.

The application should:

* Scan business cards using OCR
* Automatically extract structured contact information
* Detect and save company logos
* Link contacts to the event where they were met
* Store contacts securely in Convex backend
* Synchronize contacts across all user devices
* Download contacts locally for offline access
* Send personalized WhatsApp introductions
* Open LinkedIn profiles and send connection requests
* Become the user's professional networking CRM

---

# Technology Stack

## Frontend

* React Native (Expo)
* Typescript
* React Navigation
* React Query
* Zustand (State Management)

## Backend

* Convex
* Convex Authentication
* Convex Storage
* Convex Scheduled Functions

## OCR

Use one of:

* Google ML Kit
* Azure Vision OCR
* Google Vision API
* OpenAI Vision (Premium AI Mode)

Should support:

* English
* Chinese
* Japanese
* Korean
* Arabic
* European languages

---

# Authentication

Support:

* Email Login
* Google Login
* Apple Login
* Microsoft Login

User profile contains:

```
name
email
phone
linkedin_url
company
designation
profile_photo
```

---

# Dashboard

Display:

* Contacts Added Today
* Contacts This Week
* Events Attended
* Follow-ups Due
* LinkedIn Pending
* WhatsApp Messages Sent

Quick Actions:

* Scan Card
* Search Contacts
* View Events
* Add Manual Contact

---

# Business Card Scanner

## Camera Mode

Uses device camera.

Features:

* Auto edge detection
* Auto crop
* Perspective correction
* Auto capture
* Flash support

Supports:

Front

Back

Multi-card batch scan

---

# OCR Extraction

Extract:

```
Name
Designation
Company
Email
Phone
Mobile
Website
Address
LinkedIn URL
QR Code
```

AI should infer:

* First Name
* Last Name
* Company Domain
* Country
* Industry

Confidence score stored.

```
ocr_confidence
```

---

# Company Logo Detection

Attempt:

1. Crop logo from card

If OCR detects:

```
www.company.com
```

Download favicon/logo.

Fallback:

Search company logo online.

Store:

```
company_logo
```

inside Convex Storage.

---

# Contact Screen

Each contact contains:

```
id
photo
company_logo
first_name
last_name
designation
company
email
phone
website
linkedin
address
notes
created_date
updated_date
source
```

Additional:

```
met_at_event
met_date
met_location
meeting_notes
follow_up_date
tags
favorite
```

---

# Event Linking

Request Calendar permission.

Read user's calendar.

When card scanned:

Show nearby calendar events.

Example:

```
AI Summit KL

Malaysia Healthcare Forum

AWS GenAI Meetup

SushiTech Tokyo

MDEC Event
```

User selects:

```
Met at:
[ AI Summit KL ]
```

Stored:

```
event_id
event_name
calendar_source
```

---

# AI Event Detection

If scan time overlaps calendar event:

Suggest automatically:

"You likely met this person at AI Summit KL."

---

# Contact Notes

Voice notes

Text notes

AI Summary

Example:

"Met during coffee break.
Interested in MRI AI.
Follow up in June."

---

# Tags

Custom tags:

```
Investor

Healthcare

VC

AI

Government

Potential Client

Partner

Media
```

Multiple tags supported.

---

# Search

Search by:

* Name
* Company
* Email
* Phone
* Event
* Industry
* Tag

Support fuzzy search.

---

# Contact Timeline

Each interaction stored.

Example:

```
Card Scanned

WhatsApp Sent

LinkedIn Request Sent

Meeting Notes Added

Follow-up Completed
```

---

# WhatsApp Integration

After scan:

Show:

```
Send Introduction?
```

Generate AI message:

```
Hi Sarah,

Great meeting you today at AI Summit KL.

Looking forward to staying connected and exploring opportunities together.

Best,
Raheel
```

Editable.

Press:

Send

Uses:

```
https://wa.me/
```

with prefilled message.

No WhatsApp API required.

Track:

```
message_sent
timestamp
```

---

# LinkedIn Integration

After scan:

Open LinkedIn profile.

If profile unavailable:

Search:

```
Sarah Lim MedTech Malaysia
```

Open LinkedIn app/browser.

User sends connection request manually.

Optional Premium Mode:

AI drafts personalized note.

Example:

```
Hi Sarah,

Great meeting you today at AI Summit KL.
Would love to stay connected.

Regards,
Raheel
```

---

# Company Enrichment

Using website:

```
example.com
```

AI enriches:

* Industry
* Employee Count
* Headquarters
* Description
* Logo
* Country

Store cache.

---

# Contact Sync

Backend:

Convex

Realtime synchronization.

All changes sync automatically.

Supports:

Phone A

Tablet

Phone B

Web Portal

Desktop

---

# Local Storage

Entire contact database downloaded locally.

Use:

SQLite

or

Expo SQLite.

Offline support:

* Search
* Notes
* Event history
* Logos

When online:

Background sync.

Conflict resolution:

Last update wins.

---

# Permissions

Request:

Camera

Photos

Contacts

Calendar

Notifications

Location (optional)

---

# Phone Contacts Integration

Import existing contacts.

Detect duplicates.

Merge intelligently.

User chooses:

```
Merge

Keep Both

Replace
```

---

# Duplicate Detection

AI compares:

Name

Phone

Email

Company

LinkedIn

Shows:

```
Possible duplicate found.
```

---

# AI Follow-up

Every morning:

Generate:

```
You met these people recently:

Sarah
Jason
Ahmed
```

Suggest:

Send follow-up.

---

# AI Relationship Score

Score:

```
0-100
```

Based on:

Meeting frequency

Notes

Follow-ups

Messages

Events

---

# Notifications

Examples:

```
Follow up with Sarah

You met Jason 30 days ago

Reconnect with investor
```

---

# Export

CSV

Excel

VCF

PDF

JSON

---

# Import

CSV

Excel

VCF

---

# Settings

Theme

Dark Mode

Language

Export

Delete Account

Sync Status

Privacy

AI Settings

---

# Security

AES encrypted local database.

JWT authentication.

Biometric unlock.

FaceID.

Fingerprint.

Passcode lock.

---

# Future AI Features

## AI Business Card Correction

Fix OCR mistakes automatically.

---

## AI Contact Insights

Example:

"You now know 14 healthcare founders from Singapore."

---

## AI Smart Follow-up

Generate personalized follow-up messages.

---

## AI Event Analytics

Show:

```
AI Summit KL

42 contacts

14 investors

6 hospitals

8 startups
```

---

# Convex Schema

## users

```
id
name
email
photo
createdAt
```

## contacts

```
id
userId
firstName
lastName
designation
company
email
phone
linkedin
website
logo
eventId
notes
createdAt
updatedAt
```

## events

```
id
title
location
date
calendarSource
```

## notes

```
id
contactId
content
createdAt
```

## interactions

```
id
contactId
type
timestamp
metadata
```

---

# Success Metrics

* Card scan in under 3 seconds
* OCR accuracy above 95%
* Offline-first experience
* Real-time sync across devices
* Zero duplicate contacts
* One-tap WhatsApp introduction
* One-tap LinkedIn connection workflow
* AI-powered networking assistant for conferences and business events


# Commercialization & Platform Requirements Addendum

# Business Model

The application will operate using a **Freemium + Enterprise SaaS** model.

There will be two primary customer segments:

* Personal Users
* Enterprise Organizations

The backend architecture must support multi-tenancy, subscription management, role-based permissions, and organization-level data sharing.

---

# Subscription Plans

| Plan         | Price             | Features                                                         |
| ------------ | ----------------- | ---------------------------------------------------------------- |
| Free         | USD 0             | Up to 50 business card scans                                     |
| Personal Pro | USD 10/year       | Unlimited scans, AI follow-ups, unlimited sync                   |
| Enterprise   | USD 15/user/month | Shared company CRM, admin console, analytics, team collaboration |

---

# Free Tier

The Free plan includes:

* Scan up to 50 business cards
* OCR extraction
* Company logo detection
* Contact storage
* Local contact synchronization
* Basic event linking
* WhatsApp introduction generation
* LinkedIn profile opening
* Basic search

Restrictions:

* Maximum 50 scanned contacts
* AI enrichment limited
* No organization sharing
* No export to Excel or CSV
* No team collaboration

When the user reaches 50 scans:

Display subscription modal:

> You've reached the free limit of 50 scanned business cards.
>
> Upgrade to Personal Pro for unlimited scanning, AI features, and cloud synchronization for only **USD 10/year**.

Prevent additional scans until subscription is activated.

---

# Personal Pro Subscription

Price:

**USD 10 per year**

Unlocks:

* Unlimited business card scans
* Unlimited OCR processing
* Unlimited Convex cloud sync
* AI meeting summaries
* AI follow-up reminders
* AI message generation
* AI company enrichment
* Export contacts
* Import contacts
* Unlimited events
* Offline synchronization
* Device synchronization
* Future AI features

---

# Enterprise Subscription

Price:

**USD 15 per active user per month**

Designed for:

* Companies
* Sales teams
* Healthcare conferences
* Investment firms
* Universities
* Government agencies
* Corporate innovation teams

Enterprise operates using Organizations.

Example:

```
Organization

HealthTech Ventures
```

Contains:

```
Employees

Alice

Bob

Sarah

John
```

Each employee has an account.

Contacts can be private or shared.

---

# Organization Model

Convex schema:

```
organizations

id
name
logo
subscription
billing_email
createdAt
```

```
organizationUsers

id
organizationId
userId
role
```

Roles:

* Owner
* Admin
* Manager
* Member
* Read Only

---

# Shared Contact Database

Enterprise organizations can share contacts across all employees.

Example:

Alice scans:

```
Sarah Lim
```

Bob automatically receives:

```
Sarah Lim

Shared by Alice

Met at AI Summit KL
```

This creates a collaborative networking database.

---

# Shared Company CRM

Organization dashboard displays:

* Total Contacts
* Total Companies
* Total Meetings
* Upcoming Follow-ups
* Shared Notes
* Shared Events
* Team Activity

---

# Team Notes

Employees can add:

* Notes
* Voice notes
* Meeting summaries

Visible to entire organization.

Example:

```
Met Sarah.

Interested in MRI AI.

Follow up in July.
```

---

# Shared Timeline

Timeline example:

```
Alice scanned card

Bob emailed contact

John met contact again

Sarah scheduled meeting
```

Entire organization can see interaction history.

---

# Shared Events

Enterprise users can create events.

Example:

```
SushiTech Tokyo

Arab Health

CES

HIMSS

AI Summit KL
```

Team members can assign contacts to events.

---

# Duplicate Prevention Across Company

If another employee scans:

```
Sarah Lim
```

System detects duplicate.

Prompt:

```
This contact already exists.

Merge?

Share?

Create Duplicate?
```

---

# Team Search

Search across:

* People
* Companies
* Events
* Notes
* Tags
* Meeting history

---

# Team Analytics

Dashboard includes:

* Contacts added this month
* Events attended
* Companies met
* Industries reached
* Countries represented
* Follow-up completion rate

---

# AI Organization Insights

Example:

```
Your team met:

23 Healthcare companies

14 Investors

18 Universities

9 Government agencies
```

---

# Enterprise Admin Console

Owner/Admin can:

* Invite users
* Remove users
* Suspend users
* Assign roles
* View billing
* Manage subscription
* Export company CRM
* Configure AI settings

---

# Enterprise Billing

Charged monthly.

Example:

```
15 users

USD 15/user

Total:

USD 225/month
```

Prorated for new users.

Supports:

* Credit Card
* Apple Pay
* Google Pay
* Stripe
* Corporate Invoice

---

# Multi-Tenant Architecture

All data isolated by:

```
organizationId
```

Private contacts remain visible only to creator.

Shared contacts visible to organization.

---

# Mobile Synchronization

Contacts synchronize:

Phone

Tablet

Desktop

Web Portal

Changes appear in real time.

Offline changes sync when online.

---

# Product Website

A responsive product website must be developed alongside the mobile application.

Technology:

* Next.js
* React
* TypeScript
* Tailwind CSS
* Convex backend integration

The website should share branding and design language with the mobile application.

---

# Website Pages

## Home

Hero section:

"Turn Business Cards Into Lasting Relationships."

CTA:

Download App

Watch Demo

Pricing

Features

---

## Features

Show:

* OCR Scanning
* AI Extraction
* WhatsApp Introduction
* LinkedIn Networking
* Event Management
* Team CRM
* AI Follow-up
* Offline Sync

Include screenshots and animations.

---

## Pricing

Display three plans:

Free

Personal Pro

Enterprise

Comparison table included.

CTA:

Start Free

Upgrade

Contact Sales

---

## Enterprise

Dedicated page showcasing:

* Shared CRM
* Team Networking
* Analytics
* AI Insights
* Organization Dashboard
* Admin Console

Include case studies.

---

## Demo

Interactive product walkthrough.

Embedded product video.

Animated workflow.

---

## Blog

SEO-friendly articles about:

* Networking
* Conferences
* AI CRM
* Business Cards
* Relationship Building

CMS-backed.

---

## Contact Sales

Lead form:

Name

Email

Company

Team Size

Message

Integrated into Convex.

---

## Authentication

Users can:

* Sign In
* Sign Up
* Manage Subscription
* View Billing
* Download Mobile App

---

## Download App

App Store

Google Play

QR Code

---

# Landing Page Design

Premium SaaS aesthetic inspired by:

* Linear
* Stripe
* Notion
* Vercel

Minimalist with subtle animations and dark mode support.

---

# SEO Requirements

* Server-side rendering
* Open Graph tags
* Structured data
* Sitemap generation
* Robots.txt
* Optimized metadata
* Fast page speed

---

# Admin Portal

Web-based admin portal for platform operators.

Functions:

* User management
* Organization management
* Subscription management
* Payment management
* Contact statistics
* AI usage statistics
* OCR statistics
* Revenue dashboard
* Support tickets

---

# Revenue Dashboard

Display:

* Monthly Recurring Revenue
* Annual Recurring Revenue
* Churn
* Active Users
* Enterprise Customers
* Personal Subscribers
* Daily Active Users
* Total Scans
* OCR Accuracy
* AI Usage

---

# Future Monetization

Potential premium add-ons:

* AI Contact Research
* AI Email Generator
* AI Meeting Assistant
* AI Voice Note Summaries
* Company Intelligence
* CRM Integrations
* Salesforce Sync
* HubSpot Sync
* Microsoft Dynamics Sync
* Google Contacts Sync
* Outlook Contacts Sync
* Zapier Integration
* API Access

---

# Overall Product Vision

The platform should evolve beyond a business card scanner into an **AI-powered Professional Relationship Management Platform**, enabling individuals and enterprises to capture, enrich, organize, share, and nurture business relationships across conferences, meetings, and networking events while synchronizing seamlessly across mobile devices and the web.

A few strategic enhancements that could significantly increase commercial value are:

Enterprise lead ownership rules so contacts can be assigned to sales representatives with transfer and approval workflows.
Digital business card exchange using QR codes or NFC, eliminating the need for paper cards when both users have the app.
AI-powered company research, automatically summarizing a contact's organization, funding history, leadership, and recent news before follow-up meetings.
CRM integrations with platforms such as Salesforce, HubSpot, and Microsoft Dynamics, making the product attractive to enterprise sales teams.
Conference mode, allowing exhibitors to scan hundreds of contacts quickly and export qualified leads after the event.
Web dashboard parity, giving users access to the same contact database, search capabilities, analytics, and AI features from any browser.

With these additions, the product could be positioned not as a simple card scanner but as an AI-native networking CRM for professionals, startups, investors, and enterprise sales organizations.