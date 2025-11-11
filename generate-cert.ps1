# Generate self-signed certificate for HTTPS voice access
# This allows microphone access from any device on the local network

Write-Host "🔐 Generating self-signed SSL certificate for Slunt..."

# Create certificate
$cert = New-SelfSignedCertificate `
    -Subject "CN=192.168.1.82" `
    -DnsName "192.168.1.82", "localhost", "*.local" `
    -KeyAlgorithm RSA `
    -KeyLength 2048 `
    -NotBefore (Get-Date) `
    -NotAfter (Get-Date).AddYears(10) `
    -CertStoreLocation "Cert:\CurrentUser\My" `
    -FriendlyName "Slunt Local HTTPS" `
    -HashAlgorithm SHA256 `
    -KeyUsage DigitalSignature, KeyEncipherment, DataEncipherment `
    -TextExtension @("2.5.29.37={text}1.3.6.1.5.5.7.3.1")

$certPath = "Cert:\CurrentUser\My\$($cert.Thumbprint)"

# Export certificate (public key)
$certFile = "$PSScriptRoot\slunt-cert.pem"
Export-Certificate -Cert $certPath -FilePath "$PSScriptRoot\slunt-cert.crt" -Force | Out-Null
certutil -encode "$PSScriptRoot\slunt-cert.crt" "$certFile" | Out-Null
Remove-Item "$PSScriptRoot\slunt-cert.crt"

# Export private key
$keyFile = "$PSScriptRoot\slunt-key.pem"
$certPassword = ConvertTo-SecureString -String "slunt" -Force -AsPlainText
Export-PfxCertificate -Cert $certPath -FilePath "$PSScriptRoot\slunt.pfx" -Password $certPassword -Force | Out-Null

# Convert PFX to PEM using OpenSSL (if available)
if (Get-Command openssl -ErrorAction SilentlyContinue) {
    Write-Host "🔧 Converting certificate to PEM format..."
    & openssl pkcs12 -in "$PSScriptRoot\slunt.pfx" -nocerts -out "$keyFile" -nodes -passin pass:slunt 2>&1 | Out-Null
    Remove-Item "$PSScriptRoot\slunt.pfx"
    
    Write-Host "✅ Certificate generated successfully!"
    Write-Host ""
    Write-Host "📁 Files created:"
    Write-Host "   Certificate: slunt-cert.pem"
    Write-Host "   Private Key: slunt-key.pem"
    Write-Host ""
    Write-Host "⚠️  IMPORTANT: Trust the certificate on your device:"
    Write-Host "   1. Open: $certFile"
    Write-Host "   2. Click 'Install Certificate'"
    Write-Host "   3. Select 'Current User'"
    Write-Host "   4. Choose 'Trusted Root Certification Authorities'"
    Write-Host "   5. Click 'Finish'"
    Write-Host ""
    Write-Host "🎤 Then access voice at: https://192.168.1.82:3001/voice"
    
} else {
    Write-Host "❌ OpenSSL not found!"
    Write-Host "   Install OpenSSL or use WSL to run:"
    Write-Host "   openssl pkcs12 -in slunt.pfx -nocerts -out slunt-key.pem -nodes -passin pass:slunt"
    Write-Host ""
    Write-Host "   Or access voice from localhost only:"
    Write-Host "   http://localhost:3001/voice"
}
