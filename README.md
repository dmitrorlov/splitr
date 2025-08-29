# Splitr

MacOS application for advanced L2TP VPN split tunneling.

## Installation

### Homebrew (Recommended)

The easiest way to install Splitr is using Homebrew:

**Currently (using custom tap):**
```bash
# One-liner installation  
brew install --cask dmitrorlov/splitr/splitr

# Or step by step
brew tap dmitrorlov/splitr
brew install --cask splitr
```

**Benefits of Homebrew installation:**
- ✅ Automatic quarantine attribute removal (no manual `xattr` commands needed)
- ✅ Easy updates with `brew upgrade splitr`
- ✅ Proper installation to `/Applications`
- ✅ Clean uninstallation with `brew uninstall --cask splitr`

### Manual Installation

If you prefer not to use Homebrew:

1. Download the latest release from [GitHub Releases](https://github.com/dmitrorlov/splitr/releases)
2. Extract the ZIP file
3. Move `Splitr.app` to your `/Applications` folder
4. Remove quarantine attributes:
   ```bash
   xattr -cr /Applications/Splitr.app
   ```

## Updating

### Homebrew Users
```bash
brew upgrade splitr
```

If you got warning that latest version is already installed, run this before:

```bash
brew update
```

### Manual Installation Users
1. Download the new version
2. Replace the old app in `/Applications`
3. Run the `xattr` command again

The app also includes a built-in update checker accessible from the menu: **Splitr → Check for Updates...**

## Features

- Network routing management
- VPN service integration
- Host management and organization
- Export/import functionality
- Built-in update checking

## Requirements

- macOS 11.0 (Big Sur) or later
- Apple Silicon (ARM64) Mac

## Development

This project is built with:
- [Wails v2](https://wails.io/) - Go + Web frontend framework
- Go 1.24+ backend
- TypeScript frontend
- SQLite database

### Building from Source

1. Install dependencies:
   ```bash
   task setup  # or use npm install in frontend/ and go mod download
   ```

2. Run in development mode:
   ```bash
   wails dev
   ```

3. Build for production:
   ```bash
   task build
   ```

## Support

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/dmitrorlov/splitr/issues)
- 💡 **Feature Requests**: [GitHub Issues](https://github.com/dmitrorlov/splitr/issues)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Made with ❤️ using [Wails](https://wails.io/)
