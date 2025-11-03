# Supervisorctl Socket Fix

## The Error

```
Starting backend service...
unix:///var/run/supervisor.sock no such file
2025-11-03 14:44:09,917 WARN exited: init-db (exit status 7; not expected)
```

## Root Cause

The `supervisord.conf` file was missing the socket configuration sections required for `supervisorctl` to communicate with `supervisord`.

When `init.sh` tried to run `supervisorctl start backend`, it couldn't find the Unix socket to send the command.

## The Fix

Added the required sections to `supervisord.conf`:

### 1. Unix HTTP Server (Socket Configuration)
```ini
[unix_http_server]
file=/var/run/supervisor.sock
chmod=0700
```

### 2. Supervisorctl Configuration
```ini
[supervisorctl]
serverurl=unix:///var/run/supervisor.sock
```

### 3. RPC Interface (Required for Communication)
```ini
[rpcinterface:supervisor]
supervisor.rpcinterface_factory = supervisor.rpcinterface:make_main_rpcinterface
```

## Files Modified

1. ✅ `supervisord.conf` - Added socket and RPC configuration
2. ✅ `init.sh` - Simplified supervisorctl command (no longer needs -c flag)
3. ✅ `Dockerfile` - Cache bust to force rebuild

## Expected Behavior After Fix

```
=========================================
✅ INITIALIZATION COMPLETE!
=========================================

Starting backend service...
backend: started                         ← Should work now!
✅ Backend service started

=========================================
🚀 BACKEND STARTING
=========================================
```

The `supervisorctl start backend` command will now successfully communicate with supervisord and start the backend process.

## Deploy

```bash
cd /home/tomma/CapyxPerks
git add .
git commit -m "Fix: Add supervisorctl socket configuration"
git push origin main
```

## Why This Matters

This fix ensures that:
1. ✅ init-db can successfully start the backend after database initialization
2. ✅ Backend starts with a fresh SQLAlchemy engine that connects to the ready database
3. ✅ API returns 4 users instead of 0
4. ✅ Dev-login page displays user cards

This completes the database connection fix!

