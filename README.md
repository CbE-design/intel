# Veritas Intel - Active Security Intelligence

Professional security intelligence and real-time OSINT management system designed for South African regulatory frameworks (POPIA, NCA, RICA).

## Production Setup Requirements

### 1. Active Intelligence Gateways
Veritas Intel implements a **Service Gateway Pattern** to connect with real-time OSINT repositories and regulatory databases. For 100% authenticity, configure your service endpoints to point to Dockerized tool instances or authorized API gateways:

- **[Sherlock](https://github.com/sherlock-project/sherlock)**: username discovery across 350+ platforms.
- **[theHarvester](https://github.com/laramies/theHarvester)**: credential and domain recon.
- **[PhoneInfoga](https://github.com/sundowndev/phoneinfoga)**: GSM carrier and triangulation telemetry.
- **[Holehe](https://github.com/megadose/holehe)**: email account linkage check.
- **Have I Been Pwned / LeakCheck**: Real-time credential breach monitoring.

### 2. South African Regulatory Access
Transition from simulation to live production data using authorized gateways:
- **SAPS Criminal Checks**: Integrate via **MIE (Managed Integrity Evaluation)**.
- **DHA Identity**: Secure via **LexisNexis RefCheck**.
- **RICA Compliance**: Direct integration with **Vodacom/MTN RICA Gateways**.

### 3. Environment Configuration
Required variables for the active command center:
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyCYbIo2o2nrgFV9k9vFf1S3fp5RBeDUIHw
NEXT_PUBLIC_INTEL_GATEWAY_URL=https://your-osint-gateway-url.com
PWNED_API_KEY=your_hibp_key_here
SHODAN_API_KEY=your_shodan_key_here
```

## Features
- **Active OSINT Discovery**: Sequential real-time handshakes with digital footprint modules.
- **RICA Compliance Dossier**: Telephonic identity verification compliant with Act No. 70 of 2002.
- **GSM Triangulation**: Forensic tracking on a high-contrast monochrome vector map.
- **Dossier Confidence Scoring**: AI-driven risk modeling synthesizing breach data and registry intel.

## Technical Architecture
- **Frontend**: Next.js 15, React 19, ShadCN UI.
- **AI**: Genkit with Gemini 2.5 Flash for intelligence synthesis.
- **Styling**: Vibrant high-contrast monochrome "Forensic Terminal" theme.