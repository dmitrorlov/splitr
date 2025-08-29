# Submitting Splitr to Official Homebrew Cask Repository

This will allow users to install with the clean command: `brew install --cask splitr`

## Prerequisites

Before submitting to the official Homebrew Cask repository, ensure:

1. ✅ **Stable releases** - Have at least 1-2 stable releases
2. ✅ **Open source** - Your app is open source (check!)
3. ✅ **Notable/useful** - App serves a real purpose (check!)
4. ✅ **Consistent naming** - Release file names are consistent
5. ✅ **macOS native** - Built for macOS (check!)

## Process

### Step 1: Test Your Cask Locally

```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Create a local test directory
mkdir -p ~/tmp/homebrew-test
cd ~/tmp/homebrew-test

# Copy your updated cask file
cp /path/to/splitr/homebrew-tap/Casks/splitr.rb ./

# Test the cask syntax
brew style --fix splitr.rb

# Test installation (this will actually install the app)
brew install --cask ./splitr.rb
```

### Step 2: Get Real Release Data

Once you have your first real release (v1.0.0), update the cask with real data:

```ruby
cask "splitr" do
  version "1.0.0"  # Real version
  sha256 "abc123..."  # Real SHA256 of your release ZIP

  url "https://github.com/dmitrorlov/splitr/releases/download/v#{version}/Splitr-v#{version}-macos-arm64.zip"
  name "Splitr"
  desc "Network routing management application for macOS"
  homepage "https://github.com/dmitrorlov/splitr"

  livecheck do
    url :url
    strategy :github_latest
  end

  depends_on macos: ">= :big_sur"
  depends_on arch: :arm64

  app "Splitr.app"

  uninstall quit: "com.dmitryorlov.splitr"

  zap trash: [
    "~/Library/Application Support/Splitr",
    "~/Library/Caches/com.dmitryorlov.splitr", 
    "~/Library/Logs/Splitr",
    "~/Library/Preferences/com.dmitryorlov.splitr.plist",
    "~/Library/Saved Application State/com.dmitryorlov.splitr.savedState",
  ]
end
```

### Step 3: Fork and Submit

1. **Fork the repository**: Go to https://github.com/Homebrew/homebrew-cask and click Fork

2. **Clone your fork**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/homebrew-cask.git
   cd homebrew-cask
   ```

3. **Create a branch**:
   ```bash
   git checkout -b add-splitr-cask
   ```

4. **Add your cask**:
   ```bash
   cp path/to/your/splitr.rb Casks/s/splitr.rb
   ```
   
   Note: Casks are organized alphabetically in subdirectories by first letter.

5. **Test your cask**:
   ```bash
   brew style Casks/s/splitr.rb
   brew audit --new-cask Casks/s/splitr.rb
   brew install --cask Casks/s/splitr.rb  # Test installation
   ```

6. **Commit and push**:
   ```bash
   git add Casks/s/splitr.rb
   git commit -m "Add splitr v1.0.0"
   git push origin add-splitr-cask
   ```

7. **Create Pull Request**: Go to your fork on GitHub and click "New Pull Request"

### Step 4: PR Requirements

Your PR description should include:

```markdown
# splitr 1.0.0

- **Homepage**: https://github.com/dmitrorlov/splitr
- **Description**: Network routing management application for macOS
- **License**: MIT
- **Cask tested on**: macOS 14.x (Sonoma) / macOS 13.x (Ventura)

## Verification

- [x] `brew style Casks/s/splitr.rb` passes
- [x] `brew audit --new-cask Casks/s/splitr.rb` passes  
- [x] `brew install --cask splitr` works
- [x] App launches and functions correctly
- [x] `brew uninstall --cask splitr` removes the app
```

## Timeline

- **Submission to review**: Usually 1-7 days
- **Approval**: If no issues, approved within days
- **Available to users**: Immediately after approval

## Alternative: Start with Your Own Tap

If you want to get users started immediately:

1. **Use your custom tap** for now (`dmitrorlov/splitr/splitr`)
2. **Submit to official repo** once you have stable releases  
3. **Migrate users** by updating your documentation

Users can easily switch:
```bash
# Remove custom tap version
brew uninstall --cask dmitrorlov/splitr/splitr
brew untap dmitrorlov/splitr

# Install official version  
brew install --cask splitr
```

## Benefits of Official Repo

✅ **Clean command**: `brew install --cask splitr`  
✅ **Better discoverability**: Shows up in `brew search`  
✅ **More trust**: Official Homebrew validation  
✅ **No maintenance**: Homebrew community helps maintain  
✅ **Automatic updates**: Homebrew bot updates versions

The official submission is definitely the better long-term solution for a cleaner user experience!
