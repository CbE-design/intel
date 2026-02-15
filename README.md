# Veritas Intel - Security Intelligence App

Professional security and background check management system designed for South African regulatory frameworks.

## Setup Requirements

### 1. Google Maps Intelligence
To activate the **GSM Triangulation Vector** map, you need a Google Maps API Key:
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Enable the **Maps JavaScript API**.
3. Create an API Key in **APIs & Services > Credentials**.
4. Add it to your `.env` file:
   ```env
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
   ```

### 2. Intelligence Integrations
To activate live data feeds, you can integrate with the following South African service providers:
- **Identity & Criminal Verification**: [MIE (Managed Integrity Evaluation)](https://www.mie.co.za/) or [LexisNexis](https://www.lexisnexis.co.za/)
- **Credit Bureau Services**: [TransUnion South Africa](https://www.transunion.co.za/) or [Experian](https://www.experian.co.za/)
- **Company & CIPC Records**: [SearchWorks](https://www.searchworks.co.za/)

## Features
- **Real-time Monitoring**: Real-time Firestore listeners for subject updates.
- **AI Background Checks**: Genkit-powered intelligence analysis.
- **Deep OSINT Discovery**: Sherlock and theHarvester inspired digital footprint analysis.
- **GSM Triangulation**: Visual mapping of consented device movements.
- **POPIA Compliant**: Designed with privacy-first data handling.

## Getting Started
1. Run `npm install`
2. Run `npm run db:seed` to populate test subjects.
3. Run `npm run dev` to start the dashboard.
