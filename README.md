# Veritas Intel - Security Intelligence App

Professional security and background check management system designed for South African regulatory frameworks (POPIA & NCA).

## Setup Requirements

### 1. Google Maps Intelligence
The **GSM Triangulation Vector** map is now active using the provided API key.
1. Google Maps JavaScript API is enabled.
2. The key is stored in the `.env` file:
   ```env
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyCYbIo2o2nrgFV9k9vFf1S3fp5RBeDUIHw
   ```

### 2. Professional Intelligence Gateways
To transition from simulation to live production data, you must integrate with authorized South African service providers. **Direct API access to government databases (SAPS/DHA) is restricted to these gateways.**

- **SAPS Criminal Record Check**: Integrate via [MIE (Managed Integrity Evaluation)](https://www.mie.co.za/) or [LexisNexis RefCheck](https://www.lexisnexis.co.za/).
- **DHA Identity Verification**: Secure via [LexisNexis](https://www.lexisnexis.co.za/) or [SearchWorks](https://www.searchworks.co.za/).
- **Credit Bureau (NCA Compliant)**: Integrate with [TransUnion South Africa](https://www.transunion.co.za/) or [Experian](https://www.experian.co.za/).
- **CIPC Company Registry**: Use [SearchWorks](https://www.searchworks.co.za/) for live directorship mapping.

## Features
- **Real-time Monitoring**: Live Firestore listeners for subject updates and GSM intercepts.
- **AI Intelligence Agent**: Genkit-powered analysis synthesizing cross-platform data.
- **Deep OSINT Discovery**: Simulation modules based on GitHub's *Sherlock* and *theHarvester*.
- **GSM Triangulation**: Visual mapping of consented device movements on a forensic grayscale map.
- **POPIA Compliant**: Designed with a privacy-first data handling architecture.

## Technical Architecture
- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS.
- **Backend**: Firebase Firestore, Firebase Auth (Anonymous & Password).
- **AI**: Genkit with Gemini 2.5 Flash.
- **Styling**: ShadCN UI with a high-contrast monochrome "Forensic" theme.

## Getting Started
1. Run `npm install`
2. Run `npm run db:seed` to populate verified test subjects.
3. Run `npm run dev` to start the dashboard.