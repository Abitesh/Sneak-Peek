# Sneak-Peek Privacy Policy

**Effective date:** 28 November 2026  
**Project:** [Sneak-Peek](https://github.com/Abitesh/Sneak-Peek)

## 1. Scope

This policy describes privacy considerations for the Sneak-Peek desktop application, including its AI conversations, audio and transcription features, screen understanding, and authorized document retrieval. Features, permissions, storage locations, and provider connections depend on the application version, operating system, and your configuration.

A separately distributed browser extension or third-party service may have its own privacy terms. This desktop policy does not replace those terms.

## 2. Information Sneak-Peek may process

Depending on the features you use, Sneak-Peek may process:

- **Conversation and AI context:** messages, AI responses, selected answer modes, session instructions, and relevant conversation history.
- **Audio and transcription:** microphone or supported system audio, partial or final transcripts, speaker labels, and meeting-related context when the corresponding functionality is used.
- **Screen content:** screenshots, selected screen regions, recognized text, and visual context when screen-understanding functionality is invoked.
- **Authorized documents:** files or project materials you choose to make available, extracted text, metadata, search indexes, embeddings, and retrieved excerpts.
- **Settings and credentials:** provider choices, model settings, feature preferences, API credentials, and applicable license or activation information.
- **Operational information:** application and platform details, feature events, provider status, error categories, timings, performance metrics, and diagnostic logs.

Screen content, audio, and documents can contain personal, confidential, or third-party information. Only provide material you are authorized to process.

## 3. Local processing and storage

Sneak-Peek uses local application storage for supported settings, conversations, meeting data, retrieval indexes, and related state. Some processing can be performed on-device when a compatible local model or local service is configured.

Temporary captures, caches, model assets, logs, exported files, and backup copies may exist separately from the main application database. What is retained depends on the feature and its implementation. Uninstalling the application may not remove all local user data, exported files, or operating-system backups.

Provider credentials may be protected using operating-system secure storage where available. Where that is unavailable, the application may use a local encrypted fallback with different security properties. Local credential protection does not replace securing your device and user account.

## 4. Cloud AI and transcription services

When you choose a cloud provider or enable a feature that requires a remote service, Sneak-Peek may transmit the information needed for that request. Depending on the task, this can include your message, relevant conversation history, retrieved document excerpts, transcript text or audio, screenshots, model settings, and request metadata.

Local-model workflows can reduce external sharing for the model request, but they do not necessarily make every application feature offline. Model downloads, update checks, license operations, optional integrations, and other configured services may still require network access.

External providers process information under their own privacy policies, terms, retention rules, and security practices. Their practices may differ from Sneak-Peek's local handling. Review those terms before sending sensitive information or using a provider for confidential work.

## 5. Microphone, system audio, and screen permissions

Sneak-Peek may request operating-system permission for microphone, system audio, or screen capture when supported functionality requires it. The available permission categories and prompts vary by operating system.

You can restrict or revoke applicable permissions in your operating system. This may disable some features. Ending an active session does not necessarily erase transcripts, notes, or other information already saved or sent to an external service.

You are responsible for obtaining any required consent from meeting participants and complying with recording, workplace, school, and other applicable rules.

## 6. Diagnostic logging and telemetry

The application includes diagnostic mechanisms that can record operational events and performance metadata locally. Its telemetry implementation is designed to filter out raw prompts, transcripts, credentials, and other sensitive fields, but no logging or redaction mechanism should be considered infallible.

The code also supports configurable remote diagnostic destinations. If enabled and configured in a particular distribution or development environment, diagnostic events may be sent to the relevant external service. The specific destinations and controls depend on that configuration.

Before sharing logs, crash reports, or bug reproductions, inspect them for private information. Do not post credentials, personal transcripts, screenshots, or sensitive files in public GitHub issues.

## 7. Updates, downloads, and optional services

Checking for releases, downloading model assets, using integrations, and performing any supported licensing or activation operations may contact external endpoints. Those services can receive technical request information, such as an IP address, software version, and service-specific identifiers, according to how the feature operates.

If an optional service involves accounts or payments, the applicable service provider's privacy and payment terms also govern its processing. Do not assume that a payment or licensing provider is used unless that particular feature is enabled and configured.

## 8. Why information is processed

Information is processed as needed to provide the actions you request, preserve configured settings and session state, select and call compatible models, retrieve authorized context, manage permissions, diagnose errors, protect service integrity, and support features that you explicitly enable.

Sneak-Peek's privacy-focused architecture aims to limit retrieval and model context to the sources authorized for each request. This does not eliminate the need to review permissions, provider settings, and material before sharing it.

## 9. Retention and deletion

Local information may remain until removed by application controls, user action, or applicable cleanup mechanisms. The application does not promise a single retention period for all categories of stored data.

To reduce or remove stored information, review available conversation, session, document, and credential controls; remove unneeded local exports and caches where appropriate; and manage operating-system or backup copies separately. Back up anything you wish to retain before deleting an application profile.

Information already sent to an external provider is governed by that provider's retention and deletion procedures. Deleting a local copy does not automatically delete a provider-held copy, and deleting the application does not revoke credentials issued by a third party. Revoke unused credentials at their issuing provider.

## 10. Security and limitations

Sneak-Peek uses technical controls intended to protect credentials, manage access to authorized retrieval sources, and limit information included in model requests. However, no software, local device, network transmission, storage system, or AI provider is guaranteed to be completely secure.

Avoid processing confidential information with untrusted models or services, keep your operating system updated, and use appropriate device-level protection. AI responses may be inaccurate and should be reviewed before use in consequential decisions.

## 11. International processing

Remote AI, transcription, diagnostic, update, and other service providers may operate in other countries. If you connect such a provider, information sent to it may be processed or retained outside your country, subject to its terms and applicable law.

## 12. Your controls and requests

You can select or disconnect providers, adjust supported feature settings, manage operating-system capture permissions, and delete local information as supported by the application or your device. Depending on your jurisdiction, you may have additional rights concerning personal information held by an applicable service provider or operator.

For general questions about Sneak-Peek's privacy behavior, use the [project repository](https://github.com/Abitesh/Sneak-Peek). GitHub issues are public: do **not** include private data, credentials, or sensitive materials. For a request involving personal information, seek a private contact method from the maintainer rather than publishing the information in an issue.

## 13. Changes to this policy

This policy may be updated as Sneak-Peek features, service integrations, storage behavior, or legal requirements change. The effective date above identifies this version. Material changes should be documented before an affected feature or release is distributed.
