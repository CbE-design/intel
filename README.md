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
To transition from simulation to live production data, you must integrate with authorized South African service providers.

- **SAPS Criminal Record Check**: Integrate via [MIE (Managed Integrity Evaluation)](https://www.mie.co.za/) or [LexisNexis RefCheck](https://www.lexisnexis.co.za/).
- **DHA Identity Verification**: Secure via [LexisNexis](https://www.lexisnexis.co.za/) or [SearchWorks](https://www.searchworks.co.za/).
- **Credit Bureau (NCA Compliant)**: Integrate with [TransUnion South Africa](https://www.transunion.co.za/) or [Experian](https://www.experian.co.za/).

### 3. Authentic GitHub OSINT Integration
To make this app 100% authentic, the following repositories are implemented in simulation and should be wrapped in production via microservices:
- **[Sherlock](https://github.com/sherlock-project/sherlock)**: For deep username discovery.
- **[theHarvester](https://github.com/laramies/theHarvester)**: For recon and leaked asset mapping.
- **[PhoneInfoga](https://github.com/sundowndev/phoneinfoga)**: For phone number intelligence.
- **[Holehe](https://github.com/megadose/holehe)**: For email-based account identification.
- **[SpiderFoot](https://github.com/smicallef/spiderfoot)**: For total OSINT automation.

## Features
- **Real-time Monitoring**: Live Firestore listeners for subject updates and GSM intercepts.
- **AI Intelligence Agent**: Genkit-powered analysis synthesizing data from Sherlock, Harvester, and PhoneInfoga.
- **GSM Triangulation**: Visual mapping of device movements on a forensic monochrome map.
- **POPIA Compliant**: Privacy-first data handling architecture.

## Technical Architecture
- **Frontend**: Next.js 15, React 19, Tailwind CSS.
- **Backend**: Firebase Firestore, Firebase Auth.
- **AI**: Genkit with Gemini 2.5 Flash.
- **Styling**: High-contrast "Forensic" monochrome theme.
