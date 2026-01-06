"""
Windows compatibility utilities for handling Unicode issues
"""

import sys

def safe_print(*args, **kwargs):
    """
    Print function that replaces Unicode emoji with ASCII equivalents for Windows compatibility
    """
    # Replace Unicode emoji with ASCII equivalents
    unicode_replacements = {
        '✅': '[SUCCESS]',
        '❌': '[ERROR]',
        '🚀': '[START]',
        '🔧': '[DEBUG]',
        '📊': '[STATS]',
        '🎯': '[TARGET]',
        '⚠️': '[WARNING]',
        '📋': '[CHECKLIST]',
        '📁': '[FOLDER]',
        '📄': '[FILE]',
        '🔄': '[REFRESH]',
        '⬇️': '[DOWNLOAD]',
        '⬆️': '[UPLOAD]',
        '🗑️': '[DELETE]',
        '💾': '[SAVE]',
        '🔍': '[SEARCH]',
        '📈': '[CHART]',
        '⭐': '[STAR]',
        '✨': '[SPARKLE]'
    }

    # Convert args to strings and replace Unicode
    safe_args = []
    for arg in args:
        if isinstance(arg, str):
            safe_arg = arg
            for unicode_char, replacement in unicode_replacements.items():
                safe_arg = safe_arg.replace(unicode_char, replacement)
            safe_args.append(safe_arg)
        else:
            safe_args.append(arg)

    # Force UTF-8 encoding for output on Windows
    if sys.platform.startswith('win'):
        try:
            print(*safe_args, **kwargs)
        except (UnicodeEncodeError, OSError):
            # Fallback: encode as ASCII with replacement characters
            # Handles both UnicodeEncodeError and OSError: [Errno 22] Invalid argument
            ascii_args = []
            for arg in safe_args:
                if isinstance(arg, str):
                    ascii_args.append(arg.encode('ascii', 'replace').decode('ascii'))
                else:
                    ascii_args.append(str(arg).encode('ascii', 'replace').decode('ascii'))
            try:
                print(*ascii_args, **kwargs)
            except (UnicodeEncodeError, OSError):
                # Last resort: write to stderr with basic string conversion
                try:
                    sys.stderr.write(' '.join(str(a) for a in ascii_args) + '\n')
                except:
                    pass  # Silently fail if all else fails
    else:
        print(*safe_args, **kwargs)

def is_windows():
    """Check if running on Windows"""
    return sys.platform.startswith('win')

def set_console_encoding():
    """Set console encoding for Windows compatibility"""
    if is_windows():
        import locale
        try:
            # Try to set UTF-8 encoding
            import codecs
            sys.stdout = codecs.getwriter('utf-8')(sys.stdout.detach())
            sys.stderr = codecs.getwriter('utf-8')(sys.stderr.detach())
        except:
            # Fallback to system default
            pass