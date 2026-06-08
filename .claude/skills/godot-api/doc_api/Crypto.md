## Crypto <- RefCounted

The Crypto class provides access to advanced cryptographic functionalities. Currently, this includes asymmetric key encryption/decryption, signing/verification, and generating cryptographically secure random bytes, RSA keys, HMAC digests, and self-signed X509Certificates.

**Methods:**
- ConstantTimeCompare(byte[] trusted, byte[] received) -> bool - Compares two PackedByteArrays for equality without leaking timing information in order to prevent timing attacks. See for more information.
- Decrypt(CryptoKey key, byte[] ciphertext) -> byte[] - Decrypt the given `ciphertext` with the provided private `key`. **Note:** The maximum size of accepted ciphertext is limited by the key size.
- Encrypt(CryptoKey key, byte[] plaintext) -> byte[] - Encrypt the given `plaintext` with the provided public `key`. **Note:** The maximum size of accepted plaintext is limited by the key size.
- GenerateRandomBytes(int size) -> byte[] - Generates a PackedByteArray of cryptographically secure random bytes with given `size`.
- GenerateRsa(int size) -> CryptoKey - Generates an RSA CryptoKey that can be used for creating self-signed certificates and passed to `StreamPeerTLS.accept_stream`.
- GenerateSelfSignedCertificate(CryptoKey key, string issuerName = "CN=myserver,O=myorganisation,C=IT", string notBefore = "20140101000000", string notAfter = "20340101000000") -> X509Certificate - Generates a self-signed X509Certificate from the given CryptoKey and `issuer_name`. The certificate validity will be defined by `not_before` and `not_after` (first valid date and last valid date). The `issuer_name` must contain at least "CN=" (common name, i.e. the domain name), "O=" (organization, i.e. your company name), "C=" (country, i.e. 2 lettered ISO-3166 code of the country the organization is based in). A small example to generate an RSA key and an X509 self-signed certificate.
- HmacDigest(int hashType, byte[] key, byte[] msg) -> byte[] - Generates an digest of `msg` using `key`. The `hash_type` parameter is the hashing algorithm that is used for the inner and outer hashes. Currently, only `HashingContext.HASH_SHA256` and `HashingContext.HASH_SHA1` are supported.
- Sign(int hashType, byte[] hash, CryptoKey key) -> byte[] - Sign a given `hash` of type `hash_type` with the provided private `key`.
- Verify(int hashType, byte[] hash, byte[] signature, CryptoKey key) -> bool - Verify that a given `signature` for `hash` of type `hash_type` against the provided public `key`.

