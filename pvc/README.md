# PromptVCS - Prompt Version Control System

A Git-like version control system designed specifically for AI prompts and prompt engineering teams.

## 🚀 Features

### Core Version Control
- **Git-like Versioning**: Track every change to your prompts with detailed commit history
- **Branching & Merging**: Work on different prompt versions simultaneously
- **Rollback Capabilities**: Instantly revert to any previous version
- **Commit Messages**: Document changes with meaningful descriptions

### Team Collaboration
- **Multi-user Support**: Add collaborators to repositories
- **Team Management**: Create and manage teams for organized access control
- **Role-based Access**: Owner, contributor, and viewer roles
- **Merge Conflict Resolution**: Handle conflicting changes gracefully

### Performance Tracking
- **Real-time Metrics**: Track accuracy, speed, and cost for each prompt version
- **Performance Charts**: Visualize improvements over time
- **A/B Testing**: Compare different prompt approaches
- **Trend Analysis**: Identify performance patterns and regressions

### Advanced Features
- **Branch Management**: Create feature branches for experimental work
- **Tag System**: Label important versions (production, tested, experimental)
- **Activity Dashboard**: Monitor recent changes and team activity
- **Export/Import**: Backup and share prompt repositories

## 🛠️ Technology Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Charts**: Chart.js for performance visualization
- **Icons**: Font Awesome
- **Storage**: LocalStorage (client-side)
- **Hosting**: GitHub Pages compatible

## 📖 Quick Start

### 🌐 Deploy to GitHub Pages
1. **Fork this repository** or create a new one
2. **Upload all project files** to your repository
3. **Enable GitHub Pages** in repository Settings → Pages
4. **Access your app** at `https://yourusername.github.io/repository-name`

📋 **Detailed Instructions**: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

### 💻 Local Development
```bash
# Clone or download the repository
git clone https://github.com/yourusername/promptvcs.git

# Navigate to project directory
cd promptvcs

# Start local server
python3 -m http.server 8000
# OR
npx serve .

# Open browser
open http://localhost:8000
```

### 1. Access the Application
- Visit the deployed GitHub Pages URL
- No installation required - runs entirely in your browser

### 2. Create Your First Repository
1. Click "New Repository" on the dashboard
2. Fill in repository details and initial prompt
3. Choose public or private visibility

### 3. Start Version Control
1. Open your repository
2. Click "New Version" to create prompt iterations
3. Add meaningful commit messages
4. Track performance metrics

### 4. Collaborate with Teams
1. Add collaborators by email
2. Create feature branches for experimental work
3. Merge changes when ready
4. Resolve conflicts when they arise

## 🏗️ Project Structure

```
PromptVCS/
├── index.html          # Main application interface
├── tutorial.html       # Comprehensive user guide
├── styles.css          # Application styling
├── script.js           # Core application logic
└── README.md           # Project documentation
```

## 📚 Documentation

### Tutorial
A comprehensive tutorial is available at `tutorial.html` covering:
- Getting started with PromptVCS
- Repository management
- Version control workflows
- Team collaboration
- Performance optimization
- Conflict resolution
- Best practices

### Key Concepts

**Repository**: A container for related prompts and their version history
**Version**: A snapshot of your prompt at a specific point in time
**Branch**: A parallel line of development for experimental work
**Merge**: Combining changes from different branches
**Conflict**: When multiple changes affect the same prompt section

## 🌐 Deployment to GitHub Pages

### Automatic Deployment
1. Fork or create a repository with these files
2. Enable GitHub Pages in repository settings
3. Set source to main branch
4. Access via `https://username.github.io/repository-name`

### Manual Deployment
1. Upload files to your web server
2. Ensure all files are in the root directory
3. Access via your domain

## 💾 Data Storage

- **Client-side Storage**: Data is stored locally in browser localStorage
- **No Server Required**: Fully functional without backend infrastructure
- **Privacy**: All data remains on user's device
- **Backup**: Users can export repositories for backup

### Data Structure
```javascript
{
  repositories: [
    {
      id: "unique-id",
      name: "Repository Name",
      description: "Description",
      versions: [...],
      branches: [...],
      collaborators: [...]
    }
  ],
  teams: [...],
  activities: [...]
}
```

## 🔧 Configuration

No configuration required. The application works out of the box with sensible defaults.

### Customization Options
- **Theme**: Modify CSS variables in `styles.css`
- **Features**: Enable/disable features in `script.js`
- **Demo Data**: Customize initial demo content

## 🚀 Advanced Usage

### Enterprise Features
- **API Integration**: Connect to external performance tracking systems
- **SSO Integration**: Add single sign-on for team management
- **Advanced Analytics**: Implement detailed usage analytics
- **Server-side Storage**: Replace localStorage with database backend

### Development
```bash
# Clone the repository
git clone https://github.com/username/promptvcs.git

# Open in browser
open index.html

# Or serve with a local server
python -m http.server 8000
# Visit http://localhost:8000
```

## 📱 Browser Compatibility

- **Chrome**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+

### Required Features
- ES6+ JavaScript support
- LocalStorage API
- CSS Grid and Flexbox
- Canvas API (for charts)

## 🤝 Contributing

### How to Contribute
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Development Guidelines
- Use semantic commit messages
- Follow existing code style
- Add documentation for new features
- Test in multiple browsers

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

### Getting Help
- **Tutorial**: Complete guide available in `tutorial.html`
- **Issues**: Report bugs via GitHub Issues
- **Features**: Request features via GitHub Discussions

### Common Issues
- **Data Loss**: Data is stored locally - clear browser data carefully
- **Performance**: Large repositories may slow down browser
- **Conflicts**: Use the conflict resolution tools in the application

## 🔮 Roadmap

### Upcoming Features
- [ ] Real-time collaboration
- [ ] Advanced performance analytics
- [ ] Plugin system for custom integrations
- [ ] Mobile-responsive design improvements
- [ ] Offline support with service workers
- [ ] Advanced branching strategies
- [ ] Automated testing for prompts
- [ ] Integration with popular AI platforms

### Version History
- **v1.0.0**: Initial release with core features
- **v1.1.0**: Performance tracking and analytics
- **v1.2.0**: Team collaboration features
- **v1.3.0**: Advanced conflict resolution

## 🙏 Acknowledgments

- Inspired by Git version control system
- Built for the prompt engineering community
- Thanks to all contributors and users

---

**Ready to revolutionize your prompt development workflow?**

[🚀 Try PromptVCS Now](index.html) | [📖 Read the Tutorial](tutorial.html)
