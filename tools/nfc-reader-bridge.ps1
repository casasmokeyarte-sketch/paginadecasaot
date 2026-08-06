param(
    [int]$Port = 8765
)

$ErrorActionPreference = 'Stop'

# Conector local Casa VIP -> lector NFC PC/SC de Windows.
# Solo escucha en 127.0.0.1; no expone el lector a otros equipos de la red.

$pcscSource = @'
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;

public static class CasaVipPcsc
{
    private const uint SCARD_SCOPE_USER = 0;
    private const uint SCARD_SHARE_SHARED = 2;
    private const uint SCARD_PROTOCOL_T0 = 1;
    private const uint SCARD_PROTOCOL_T1 = 2;
    private const uint SCARD_LEAVE_CARD = 0;
    private const int SCARD_S_SUCCESS = 0;

    [StructLayout(LayoutKind.Sequential)]
    public struct SCARD_IO_REQUEST
    {
        public uint dwProtocol;
        public uint cbPciLength;
    }

    [DllImport("winscard.dll")]
    private static extern int SCardEstablishContext(
        uint dwScope,
        IntPtr pvReserved1,
        IntPtr pvReserved2,
        out IntPtr phContext
    );

    [DllImport("winscard.dll")]
    private static extern int SCardReleaseContext(IntPtr hContext);

    [DllImport("winscard.dll", CharSet = CharSet.Unicode)]
    private static extern int SCardListReaders(
        IntPtr hContext,
        string mszGroups,
        char[] mszReaders,
        ref uint pcchReaders
    );

    [DllImport("winscard.dll", CharSet = CharSet.Unicode)]
    private static extern int SCardConnect(
        IntPtr hContext,
        string szReader,
        uint dwShareMode,
        uint dwPreferredProtocols,
        out IntPtr phCard,
        out uint pdwActiveProtocol
    );

    [DllImport("winscard.dll")]
    private static extern int SCardDisconnect(IntPtr hCard, uint dwDisposition);

    [DllImport("winscard.dll")]
    private static extern int SCardTransmit(
        IntPtr hCard,
        ref SCARD_IO_REQUEST pioSendPci,
        byte[] pbSendBuffer,
        uint cbSendLength,
        IntPtr pioRecvPci,
        byte[] pbRecvBuffer,
        ref uint pcbRecvLength
    );

    private static void ThrowPcsc(string operation, int result)
    {
        throw new InvalidOperationException(
            operation + " fallo (PC/SC 0x" + unchecked((uint)result).ToString("X8") + ")."
        );
    }

    private static string[] ListReadersInternal(IntPtr context)
    {
        uint length = 0;
        int result = SCardListReaders(context, null, null, ref length);
        if (result != SCARD_S_SUCCESS) ThrowPcsc("SCardListReaders", result);
        if (length == 0) return new string[0];

        char[] buffer = new char[length];
        result = SCardListReaders(context, null, buffer, ref length);
        if (result != SCARD_S_SUCCESS) ThrowPcsc("SCardListReaders", result);

        string raw = new string(buffer);
        return raw.Split(new char[] { '\0' }, StringSplitOptions.RemoveEmptyEntries);
    }

    public static string[] GetReaders()
    {
        IntPtr context;
        int result = SCardEstablishContext(SCARD_SCOPE_USER, IntPtr.Zero, IntPtr.Zero, out context);
        if (result != SCARD_S_SUCCESS) ThrowPcsc("SCardEstablishContext", result);

        try
        {
            return ListReadersInternal(context);
        }
        finally
        {
            SCardReleaseContext(context);
        }
    }

    private static string SelectContactlessReader(string[] readers)
    {
        foreach (string reader in readers)
        {
            if (reader.IndexOf("Contactless", StringComparison.OrdinalIgnoreCase) >= 0)
                return reader;
        }
        return readers.Length > 0 ? readers[0] : null;
    }

    public static string[] ReadUid(int timeoutMs)
    {
        IntPtr context;
        int result = SCardEstablishContext(SCARD_SCOPE_USER, IntPtr.Zero, IntPtr.Zero, out context);
        if (result != SCARD_S_SUCCESS) ThrowPcsc("SCardEstablishContext", result);

        try
        {
            string[] readers = ListReadersInternal(context);
            string reader = SelectContactlessReader(readers);
            if (String.IsNullOrEmpty(reader))
                throw new InvalidOperationException("Windows no encontro un lector PC/SC conectado.");

            DateTime deadline = DateTime.UtcNow.AddMilliseconds(Math.Max(1000, timeoutMs));

            while (DateTime.UtcNow < deadline)
            {
                IntPtr card;
                uint protocol;
                result = SCardConnect(
                    context,
                    reader,
                    SCARD_SHARE_SHARED,
                    SCARD_PROTOCOL_T0 | SCARD_PROTOCOL_T1,
                    out card,
                    out protocol
                );

                if (result == SCARD_S_SUCCESS)
                {
                    try
                    {
                        // PC/SC GET DATA: solicita el UID de la tarjeta contactless.
                        byte[] command = new byte[] { 0xFF, 0xCA, 0x00, 0x00, 0x00 };
                        byte[] response = new byte[258];
                        uint responseLength = (uint)response.Length;
                        SCARD_IO_REQUEST pci = new SCARD_IO_REQUEST {
                            dwProtocol = protocol,
                            cbPciLength = (uint)Marshal.SizeOf(typeof(SCARD_IO_REQUEST))
                        };

                        int transmit = SCardTransmit(
                            card,
                            ref pci,
                            command,
                            (uint)command.Length,
                            IntPtr.Zero,
                            response,
                            ref responseLength
                        );
                        if (transmit != SCARD_S_SUCCESS) ThrowPcsc("SCardTransmit", transmit);
                        if (responseLength < 3)
                            throw new InvalidOperationException("El lector devolvio una respuesta NFC incompleta.");

                        byte sw1 = response[responseLength - 2];
                        byte sw2 = response[responseLength - 1];
                        if (sw1 != 0x90 || sw2 != 0x00)
                            throw new InvalidOperationException(
                                "El lector rechazo GET UID (SW=" + sw1.ToString("X2") + sw2.ToString("X2") + ")."
                            );

                        int uidLength = (int)responseLength - 2;
                        StringBuilder uid = new StringBuilder(uidLength * 2);
                        for (int i = 0; i < uidLength; i++) uid.Append(response[i].ToString("X2"));

                        return new string[] { reader, uid.ToString() };
                    }
                    finally
                    {
                        SCardDisconnect(card, SCARD_LEAVE_CARD);
                    }
                }

                Thread.Sleep(180);
            }

            throw new TimeoutException("No se detecto una tarjeta. Acerque la NTAG215 al lector e intente otra vez.");
        }
        finally
        {
            SCardReleaseContext(context);
        }
    }
}
'@

Add-Type -TypeDefinition $pcscSource -Language CSharp

$allowedOrigins = @(
    'https://casasmokeyarte.com',
    'https://www.casasmokeyarte.com',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
)

function Send-JsonResponse {
    param(
        [System.Net.Sockets.NetworkStream]$Stream,
        [int]$StatusCode,
        [string]$StatusText,
        [object]$Payload,
        [string]$Origin = ''
    )

    $body = $Payload | ConvertTo-Json -Compress -Depth 6
    $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($body)
    $headers = @(
        "HTTP/1.1 $StatusCode $StatusText",
        'Content-Type: application/json; charset=utf-8',
        "Content-Length: $($bodyBytes.Length)",
        'Cache-Control: no-store',
        'Access-Control-Allow-Methods: GET, OPTIONS',
        'Access-Control-Allow-Headers: Content-Type',
        'Access-Control-Allow-Private-Network: true',
        'Connection: close'
    )
    if ($Origin) {
        $headers += "Access-Control-Allow-Origin: $Origin"
        $headers += 'Vary: Origin'
    }
    $headerBytes = [System.Text.Encoding]::ASCII.GetBytes(($headers -join "`r`n") + "`r`n`r`n")
    $Stream.Write($headerBytes, 0, $headerBytes.Length)
    $Stream.Write($bodyBytes, 0, $bodyBytes.Length)
    $Stream.Flush()
}

function Send-OptionsResponse {
    param(
        [System.Net.Sockets.NetworkStream]$Stream,
        [string]$Origin
    )
    $headers = @(
        'HTTP/1.1 204 No Content',
        'Content-Length: 0',
        'Access-Control-Allow-Methods: GET, OPTIONS',
        'Access-Control-Allow-Headers: Content-Type',
        'Access-Control-Allow-Private-Network: true',
        "Access-Control-Allow-Origin: $Origin",
        'Vary: Origin',
        'Connection: close'
    )
    $bytes = [System.Text.Encoding]::ASCII.GetBytes(($headers -join "`r`n") + "`r`n`r`n")
    $Stream.Write($bytes, 0, $bytes.Length)
    $Stream.Flush()
}

$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $Port)
$listener.Start()

Write-Host ''
Write-Host 'CASA VIP - LECTOR NFC USB' -ForegroundColor Cyan
Write-Host "Conector activo en http://127.0.0.1:$Port" -ForegroundColor Green
Write-Host 'Lector esperado: Generic Contactless Card Reader 0' -ForegroundColor Gray
Write-Host 'Mantenga esta ventana abierta mientras usa el panel VIP.' -ForegroundColor Yellow
Write-Host 'Para detenerlo: Ctrl+C' -ForegroundColor Gray
Write-Host ''

try {
    while ($true) {
        $client = $listener.AcceptTcpClient()
        try {
            $stream = $client.GetStream()
            $reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::ASCII, $false, 4096, $true)
            $requestLine = $reader.ReadLine()
            if (-not $requestLine) { continue }

            $headers = @{}
            while (($line = $reader.ReadLine()) -ne $null -and $line -ne '') {
                $separator = $line.IndexOf(':')
                if ($separator -gt 0) {
                    $name = $line.Substring(0, $separator).Trim().ToLowerInvariant()
                    $value = $line.Substring($separator + 1).Trim()
                    $headers[$name] = $value
                }
            }

            $parts = $requestLine.Split(' ')
            $method = $parts[0]
            $target = if ($parts.Length -gt 1) { $parts[1] } else { '/' }
            $origin = if ($headers.ContainsKey('origin')) { $headers['origin'] } else { '' }

            if ($origin -and $allowedOrigins -notcontains $origin) {
                Send-JsonResponse $stream 403 'Forbidden' @{ ok = $false; error = 'Origen web no autorizado.' }
                continue
            }

            if ($method -eq 'OPTIONS') {
                Send-OptionsResponse $stream $origin
                continue
            }

            $uri = [System.Uri]::new("http://127.0.0.1:$Port$target")

            if ($method -eq 'GET' -and $uri.AbsolutePath -eq '/health') {
                try {
                    $readers = [CasaVipPcsc]::GetReaders()
                    Send-JsonResponse $stream 200 'OK' @{
                        ok = $true
                        service = 'casa-vip-pcsc'
                        readers = $readers
                        preferred_reader = ($readers | Where-Object { $_ -match 'Contactless' } | Select-Object -First 1)
                    } $origin
                }
                catch {
                    Send-JsonResponse $stream 500 'Internal Server Error' @{
                        ok = $false
                        error = $_.Exception.Message
                    } $origin
                }
                continue
            }

            if ($method -eq 'GET' -and $uri.AbsolutePath -eq '/read') {
                try {
                    $timeout = 20000
                    if ($uri.Query -match '(?:^\?|&)timeout=(\d+)') {
                        $parsed = 0
                        if ([int]::TryParse($Matches[1], [ref]$parsed)) {
                            $timeout = [Math]::Max(3000, [Math]::Min(30000, $parsed))
                        }
                    }

                    Write-Host 'Esperando NTAG215...' -ForegroundColor Yellow
                    $result = [CasaVipPcsc]::ReadUid($timeout)
                    Write-Host "Tarjeta leida: $($result[1])" -ForegroundColor Green
                    Send-JsonResponse $stream 200 'OK' @{
                        ok = $true
                        reader = $result[0]
                        uid = $result[1]
                        card_type = 'NTAG215'
                    } $origin
                }
                catch {
                    Write-Host $_.Exception.Message -ForegroundColor Red
                    Send-JsonResponse $stream 408 'Request Timeout' @{
                        ok = $false
                        error = $_.Exception.Message
                    } $origin
                }
                continue
            }

            Send-JsonResponse $stream 404 'Not Found' @{ ok = $false; error = 'Ruta no encontrada.' } $origin
        }
        catch {
            Write-Host $_.Exception.Message -ForegroundColor Red
        }
        finally {
            $client.Close()
        }
    }
}
finally {
    $listener.Stop()
}
