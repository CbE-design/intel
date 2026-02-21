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

### 2. Real-time GitHub OSINT Integration
Veritas Intel implements a **Service Gateway Pattern** to integrate real-time OSINT repositories. For 100% authenticity in production, point the following service endpoints to your Dockerized module instances:

- **[Sherlock](https://github.com/sherlock-project/sherlock)**: Active username discovery across 350+ platforms.
- **[theHarvester](https://github.com/laramies/theHarvester)**: Passive recon for emails, domains, and public assets.
- **[PhoneInfoga](https://github.com/sundowndev/phoneinfoga)**: Telephonic reconnaissance and GSM triangulation.
- **[Holehe](https://github.com/megadose/holehe)**: Email-based identity account tracing.

### 3. Professional South African Gateways
To transition from simulation to live production data for regulatory checks:
- **SAPS Criminal Record Check**: Integrate via **MIE (Managed Integrity Evaluation)**.
- **DHA Identity Verification**: Secure via **LexisNexis RefCheck**.
- **RICA Compliance**: Verify telephonic identity via **Vodacom/MTN RICA Portal APIs**.

## Features
- **Real-time Monitoring**: Live Firestore listeners for subject updates and GSM intercepts.
- **AI Intelligence Agent**: Genkit-powered analysis synthesizing data from Sherlock, Harvester, and PhoneInfoga.
- **GSM Triangulation**: Visual mapping of device movements on a forensic monochrome map.
- **Vibrant Monochrome UI**: High-contrast "Forensic Terminal" aesthetic.

## Technical Architecture
- **Frontend**: Next.js 15, React 19, Tailwind CSS.
- **Backend**: Firebase Firestore, Firebase Auth.
- **AI**: Genkit with Gemini 2.5 Flash.
- **Styling**: High-contrast monochrome "Forensic" theme.
