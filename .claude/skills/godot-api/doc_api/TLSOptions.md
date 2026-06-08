## TLSOptions <- RefCounted

TLSOptions abstracts the configuration options for the StreamPeerTLS and PacketPeerDTLS classes. Objects of this class cannot be instantiated directly, and one of the static methods `client`, `client_unsafe`, or `server` should be used instead.

**Methods:**
- Client(X509Certificate trustedChain = null, string commonNameOverride = "") -> TLSOptions - Creates a TLS client configuration which validates certificates and their common names (fully qualified domain names). You can specify a custom `trusted_chain` of certification authorities (the default CA list will be used if `null`), and optionally provide a `common_name_override` if you expect the certificate to have a common name other than the server FQDN. **Note:** On the Web platform, TLS verification is always enforced against the CA list of the web browser. This is considered a security feature.
- ClientUnsafe(X509Certificate trustedChain = null) -> TLSOptions - Creates an **unsafe** TLS client configuration where certificate validation is optional. You can optionally provide a valid `trusted_chain`, but the common name of the certificates will never be checked. Using this configuration for purposes other than testing **is not recommended**. **Note:** On the Web platform, TLS verification is always enforced against the CA list of the web browser. This is considered a security feature.
- GetCommonNameOverride() -> string - Returns the common name (domain name) override specified when creating with `TLSOptions.client`.
- GetOwnCertificate() -> X509Certificate - Returns the X509Certificate specified when creating with `TLSOptions.server`.
- GetPrivateKey() -> CryptoKey - Returns the CryptoKey specified when creating with `TLSOptions.server`.
- GetTrustedCaChain() -> X509Certificate - Returns the CA X509Certificate chain specified when creating with `TLSOptions.client` or `TLSOptions.client_unsafe`.
- IsServer() -> bool - Returns `true` if created with `TLSOptions.server`, `false` otherwise.
- IsUnsafeClient() -> bool - Returns `true` if created with `TLSOptions.client_unsafe`, `false` otherwise.
- Server(CryptoKey key, X509Certificate certificate) -> TLSOptions - Creates a TLS server configuration using the provided `key` and `certificate`. **Note:** The `certificate` should include the full certificate chain up to the signing CA (certificates file can be concatenated using a general purpose text editor).

