# Veritas Intel - Security Intelligence App

Professional security and background check management system designed for South African regulatory frameworks.

## Intelligence Integrations

To activate live data feeds, you can integrate with the following South African service providers:

- **Identity & Criminal Verification**: [MIE (Managed Integrity Evaluation)](https://www.mie.co.za/) or [LexisNexis](https://www.lexisnexis.co.za/)
- **Credit Bureau Services**: [TransUnion South Africa](https://www.transunion.co.za/) or [Experian](https://www.experian.co.za/)
- **Company & CIPC Records**: [SearchWorks](https://www.searchworks.co.za/)
- **Location Intelligence**: [Google Maps Platform](https://console.cloud.google.com/google/maps-apis/) (Pre-configured)

## Features
- **Real-time Monitoring**: Real-time Firestore listeners for subject updates.
- **AI Background Checks**: Genkit-powered intelligence analysis.
- **POPIA Compliant**: Designed with privacy-first data handling.
- **Location History**: Visual mapping of consented device movements.

## Getting Started
1. Run `npm install`
2. Run `npm run db:seed` to populate test subjects.
3. Run `npm run dev` to start the dashboard.
