'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  decodeJWT,
  formatTimestamp,
  generateSampleJWT,
  isTokenExpired,
  verifySignature,
  type DecodedJWT,
} from '@/lib/jwt-utils';
import { AlertCircle, CheckCircle, Copy, XCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function JWTPage() {
  const [token, setToken] = useState('');
  const [decodedJWT, setDecodedJWT] = useState<DecodedJWT | null>(null);
  const [secretKey, setSecretKey] = useState('');
  const [algorithm, setAlgorithm] = useState('HS256');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<
    'pending' | 'valid' | 'invalid' | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  const handleDecodeJWT = () => {
    if (!token.trim()) {
      setError('Please enter a JWT token');
      setDecodedJWT(null);
      setVerificationResult(null);
      return;
    }

    try {
      const decoded = decodeJWT(token.trim());
      setDecodedJWT(decoded);
      setError(null);
      setVerificationResult(null);
      toast.success('JWT decoded successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to decode JWT');
      setDecodedJWT(null);
      setVerificationResult(null);
    }
  };

  const handleClear = () => {
    setToken('');
    setDecodedJWT(null);
    setError(null);
    setVerificationResult(null);
    setSecretKey('');
  };

  const handleGenerateSample = () => {
    const sampleJWT = generateSampleJWT();
    setToken(sampleJWT);
    try {
      const decoded = decodeJWT(sampleJWT);
      setDecodedJWT(decoded);
      setError(null);
      setVerificationResult(null);
      toast.success('Sample JWT generated and decoded!');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to decode sample JWT',
      );
    }
  };

  const handleVerifySignature = async () => {
    if (!token.trim()) {
      toast.error('Please enter a JWT token first');
      return;
    }

    if (!secretKey.trim()) {
      toast.error('Please enter a secret key');
      return;
    }

    setIsVerifying(true);
    setVerificationResult('pending');

    try {
      const isValid = await verifySignature(token.trim(), secretKey, algorithm);
      setVerificationResult(isValid ? 'valid' : 'invalid');
      toast.success(isValid ? 'Signature is valid!' : 'Signature is invalid!');
    } catch (err) {
      setVerificationResult('invalid');
      toast.error(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard!`);
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  const getTokenStatus = () => {
    if (!decodedJWT) return { status: 'Not decoded', color: 'bg-gray-500' };

    if (isTokenExpired(decodedJWT.payload.exp)) {
      return { status: 'Expired', color: 'bg-red-500' };
    }

    return { status: 'Valid', color: 'bg-green-500' };
  };

  const getVerificationStatusIcon = () => {
    switch (verificationResult) {
      case 'valid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'invalid':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <div className="h-2 w-2 rounded-full bg-gray-500" />;
    }
  };

  const getVerificationStatusText = () => {
    switch (verificationResult) {
      case 'valid':
        return 'Signature is valid';
      case 'invalid':
        return 'Signature is invalid';
      case 'pending':
        return 'Verifying...';
      default:
        return 'Signature not verified';
    }
  };

  const tokenStatus = getTokenStatus();

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">JWT Decoder</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>JWT Token Input</CardTitle>
            <CardDescription>
              Paste your JWT token here to decode and inspect its contents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">JWT Token</label>
                <textarea
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
                />
              </div>
              {error && (
                <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
                  {error}
                </div>
              )}
              <div className="flex gap-2">
                <Button onClick={handleDecodeJWT} className="flex-1">
                  Decode JWT
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClear}
                  className="flex-1"
                >
                  Clear
                </Button>
                <Button
                  variant="outline"
                  onClick={handleGenerateSample}
                  className="flex-1"
                >
                  Generate Sample JWT
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Header</CardTitle>
            <CardDescription>
              JWT header contains metadata about the token
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="min-h-[200px] rounded-md border p-4 bg-muted font-mono text-sm overflow-auto">
                {decodedJWT ? (
                  <pre className="whitespace-pre-wrap">
                    {JSON.stringify(decodedJWT.header, null, 2)}
                  </pre>
                ) : (
                  <p className="text-muted-foreground">
                    JWT header will appear here...
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() =>
                  decodedJWT &&
                  copyToClipboard(
                    JSON.stringify(decodedJWT.header, null, 2),
                    'Header',
                  )
                }
                disabled={!decodedJWT}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Header
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payload</CardTitle>
            <CardDescription>
              JWT payload contains the actual claims and data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="min-h-[200px] rounded-md border p-4 bg-muted font-mono text-sm overflow-auto">
                {decodedJWT ? (
                  <pre className="whitespace-pre-wrap">
                    {JSON.stringify(decodedJWT.payload, null, 2)}
                  </pre>
                ) : (
                  <p className="text-muted-foreground">
                    JWT payload will appear here...
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() =>
                  decodedJWT &&
                  copyToClipboard(
                    JSON.stringify(decodedJWT.payload, null, 2),
                    'Payload',
                  )
                }
                disabled={!decodedJWT}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Payload
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Signature Verification</CardTitle>
            <CardDescription>
              Verify the JWT signature with a secret key
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Secret Key</label>
                <input
                  type="password"
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Enter secret key for verification..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Algorithm</label>
                <Select value={algorithm} onValueChange={setAlgorithm}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HS256">HS256</SelectItem>
                    <SelectItem value="HS384">HS384</SelectItem>
                    <SelectItem value="HS512">HS512</SelectItem>
                    <SelectItem value="RS256" disabled>
                      RS256 (Not supported)
                    </SelectItem>
                    <SelectItem value="RS384" disabled>
                      RS384 (Not supported)
                    </SelectItem>
                    <SelectItem value="RS512" disabled>
                      RS512 (Not supported)
                    </SelectItem>
                    <SelectItem value="ES256" disabled>
                      ES256 (Not supported)
                    </SelectItem>
                    <SelectItem value="ES384" disabled>
                      ES384 (Not supported)
                    </SelectItem>
                    <SelectItem value="ES512" disabled>
                      ES512 (Not supported)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full"
                onClick={handleVerifySignature}
                disabled={isVerifying || !token.trim() || !secretKey.trim()}
              >
                {isVerifying ? 'Verifying...' : 'Verify Signature'}
              </Button>
              <div className="flex items-center gap-2 p-2 rounded-md bg-muted">
                {getVerificationStatusIcon()}
                <span className="text-sm">{getVerificationStatusText()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Token Information</CardTitle>
            <CardDescription>
              Additional information about the JWT token
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Token Type:</span>
                  <span className="text-sm text-muted-foreground">
                    {decodedJWT?.header.typ || '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Algorithm:</span>
                  <span className="text-sm text-muted-foreground">
                    {decodedJWT?.header.alg || '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Issued At:</span>
                  <span className="text-sm text-muted-foreground">
                    {formatTimestamp(decodedJWT?.payload.iat)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Expires At:</span>
                  <span className="text-sm text-muted-foreground">
                    {formatTimestamp(decodedJWT?.payload.exp)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Subject:</span>
                  <span className="text-sm text-muted-foreground">
                    {decodedJWT?.payload.sub || '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Issuer:</span>
                  <span className="text-sm text-muted-foreground">
                    {decodedJWT?.payload.iss || '-'}
                  </span>
                </div>
              </div>
              <div className="pt-2 border-t">
                <div className="flex items-center gap-2">
                  <div
                    className={`h-2 w-2 rounded-full ${tokenStatus.color}`}
                  />
                  <span className="text-sm">
                    Token Status: {tokenStatus.status}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
