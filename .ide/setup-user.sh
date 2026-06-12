#!/bin/bash
# Interactive user registration script for CNB dev environment
# Triggered on first shell login; creates a non-root dev user for bypass-mode tools.

# When sourced from /etc/profile.d/, the running shell may be dash/sh.
# Re-exec under bash if not already running in bash.
if [ -z "$BASH_VERSION" ]; then
    if [ -t 0 ] && [ -x /bin/bash ]; then
        /bin/bash "/etc/profile.d/01-dev-user-setup.sh" "$@"
        return 0 2>/dev/null || exit 0
    else
        return 0 2>/dev/null || exit 0
    fi
fi

LOCK_FILE="/tmp/.dev-user-created"

# Skip if user already registered in this session
if [ -f "$LOCK_FILE" ]; then
    return 0 2>/dev/null || exit 0
fi

# Skip if not running in an interactive terminal
if [ ! -t 0 ]; then
    return 0 2>/dev/null || exit 0
fi

# Skip if a non-root user (other than nobody) already exists with UID >= 1000
if id -u 2>/dev/null | grep -qv '^0$'; then
    if [ "$(id -u)" -ne 0 ]; then
        return 0 2>/dev/null || exit 0
    fi
fi

echo "============================================"
echo "  CNB Dev Environment - User Registration"
echo "============================================"
echo ""
echo "Create a non-root user for Claude Code bypass mode / Codex."
echo ""

# Read username
while true; do
    read -p "Username: " DEV_USER
    if [ -z "$DEV_USER" ]; then
        echo "Username cannot be empty."
        continue
    fi
    if echo "$DEV_USER" | grep -qP '[^a-z0-9_-]'; then
        echo "Username can only contain lowercase letters, digits, _ and -"
        continue
    fi
    break
done

# Read password (use stty to hide input for portability)
while true; do
    printf "Password: "
    stty -echo 2>/dev/null
    read DEV_PASS
    stty echo 2>/dev/null
    echo ""
    if [ -z "$DEV_PASS" ]; then
        echo "Password cannot be empty."
        continue
    fi
    if [ ${#DEV_PASS} -lt 4 ]; then
        echo "Password must be at least 4 characters."
        continue
    fi
    printf "Confirm password: "
    stty -echo 2>/dev/null
    read DEV_PASS2
    stty echo 2>/dev/null
    echo ""
    if [ "$DEV_PASS" != "$DEV_PASS2" ]; then
        echo "Passwords do not match. Try again."
        continue
    fi
    break
done

# Create user
useradd -m -s /bin/bash "$DEV_USER" 2>/dev/null
echo "$DEV_USER:$DEV_PASS" | chpasswd

# Grant sudo without password
if command -v sudo &>/dev/null; then
    echo "$DEV_USER ALL=(ALL) NOPASSWD:ALL" > "/etc/sudoers.d/$DEV_USER"
    chmod 440 "/etc/sudoers.d/$DEV_USER"
fi

# Copy workspace access
usermod -aG root "$DEV_USER" 2>/dev/null

# Ensure the new user can access /workspace
if [ -d /workspace ]; then
    setfacl -R -m u:"$DEV_USER":rwx /workspace 2>/dev/null || \
        chmod -R o+rwx /workspace 2>/dev/null || true
fi

# Mark as done
touch "$LOCK_FILE"
echo "$DEV_USER" > /tmp/.dev-username

echo ""
echo "============================================"
echo "  User '$DEV_USER' created successfully!"
echo "============================================"
echo ""
echo "Switch to your user:"
echo "  su - $DEV_USER"
echo ""
echo "Or run Claude Code in bypass mode:"
echo "  su - $DEV_USER -c 'claude --dangerously-skip-permissions'"
echo ""
echo "Quick alias (available now):"
echo "  alias cdev='su - $DEV_USER'"
echo ""

# Set up alias for convenience
alias cdev="su - $DEV_USER"
