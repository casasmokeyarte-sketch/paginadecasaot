@echo off
title Casa VIP - Lector NFC USB
cd /d "%~dp0"
powershell.exe -NoProfile -File "%~dp0nfc-reader-bridge.ps1"
pause
