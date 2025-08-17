// PromptVCS - Advanced Prompt Version Control System
class PromptVCS {
    constructor() {
        this.repositories = JSON.parse(localStorage.getItem('promptvcs_repos') || '[]');
        this.teams = JSON.parse(localStorage.getItem('promptvcs_teams') || '[]');
        this.userProfile = {
            name: "User",
            email: "user@example.com", 
            bio: "", 
            timezone: "UTC"
        };
        this.userSettings = {
            darkMode: false, 
            language: "en", 
            emailNotifications: true, 
            pushNotifications: true, 
            publicProfile: false, 
            analytics: true
        };
        this.currentRepo = null;
        this.currentTeam = null;
        this.currentVersion = null;
        this.performanceChart = null;
        
        // Don't call init() here - wait for DOM to be ready
    }

    init() {
        this.loadUserData();
        this.setupEventListeners();
        this.updateUserDisplay();
        this.updateStats();
        this.renderRepositories();
        this.renderTeams();
        this.updateActivity();
        
        // Apply dark mode if enabled
        if (this.userSettings.darkMode) {
            document.body.classList.add('dark-mode');
        }
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link:not(.tutorial-link)').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = e.target.getAttribute('href').substring(1);
                this.showSection(target);
            });
        });

        // Repository modals
        document.getElementById('newRepoBtn').addEventListener('click', () => this.openRepoModal());
        document.getElementById('addRepoBtn').addEventListener('click', () => this.openRepoModal());
        document.getElementById('repoForm').addEventListener('submit', (e) => this.handleRepoSubmit(e));
        document.getElementById('cancelRepo').addEventListener('click', () => this.closeModal('repoModal'));

        // Version modal
        document.getElementById('versionForm').addEventListener('submit', (e) => this.handleVersionSubmit(e));
        document.getElementById('cancelVersion').addEventListener('click', () => this.closeModal('versionModal'));

        // Team modal
        document.getElementById('createTeamBtn').addEventListener('click', () => this.openTeamModal());
        document.getElementById('teamForm').addEventListener('submit', (e) => this.handleTeamSubmit(e));
        document.getElementById('cancelTeam').addEventListener('click', () => this.closeModal('teamModal'));

        // User profile and settings
        document.getElementById('userProfile').addEventListener('click', () => this.toggleUserDropdown());
        document.getElementById('userProfileForm').addEventListener('submit', (e) => this.handleUserProfileSubmit(e));
        document.getElementById('userSettingsForm').addEventListener('submit', (e) => this.handleUserSettingsSubmit(e));
        document.getElementById('cancelUserProfile').addEventListener('click', () => this.closeModal('userProfileModal'));
        document.getElementById('cancelUserSettings').addEventListener('click', () => this.closeModal('userSettingsModal'));

        // Team detail modal
        document.getElementById('addMemberBtn').addEventListener('click', () => this.addTeamMember());
        document.getElementById('addRepoToTeamBtn').addEventListener('click', () => this.addRepoToTeam());
        document.getElementById('teamSettingsForm').addEventListener('submit', (e) => this.handleTeamSettingsSubmit(e));
        document.getElementById('deleteTeamBtn').addEventListener('click', () => this.deleteTeam());

        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.user-profile')) {
                this.closeUserDropdown();
            }
        });

        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                this.closeModal(modal.id);
            });
        });

        // Tab switching
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab-btn')) {
                this.switchTab(e.target);
            }
        });

        // Repository detail tabs and actions
        this.setupRepoDetailEvents();
    }

    setupRepoDetailEvents() {
        document.getElementById('newVersionBtn').addEventListener('click', () => this.openVersionModal());
        document.getElementById('mergeBtn').addEventListener('click', () => this.handleMerge());
        document.getElementById('addCollaboratorBtn').addEventListener('click', () => this.addCollaborator());
    }

    showSection(sectionId) {
        // Update navigation
        document.querySelectorAll('.nav-link:not(.tutorial-link)').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[href="#${sectionId}"]`).classList.add('active');

        // Show section
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(sectionId).classList.add('active');
    }

    // Repository Management
    openRepoModal(repo = null) {
        const modal = document.getElementById('repoModal');
        const form = document.getElementById('repoForm');
        const submitBtn = document.getElementById('submitRepoBtn');
        
        if (repo) {
            document.getElementById('repoModalTitle').textContent = 'Edit Repository';
            submitBtn.textContent = 'Update Repository';
            document.getElementById('repoName').value = repo.name;
            document.getElementById('repoDescription').value = repo.description;
            document.getElementById('initialPrompt').value = repo.versions[0]?.content || '';
            document.getElementById('isPrivate').checked = repo.private;
            form.dataset.editId = repo.id;
        } else {
            document.getElementById('repoModalTitle').textContent = 'Create New Repository';
            submitBtn.textContent = 'Create Repository';
            form.reset();
            delete form.dataset.editId;
        }
        
        this.populateRepoTeamsList(repo);
        this.showModal('repoModal');
    }

    populateRepoTeamsList(repo = null) {
        const container = document.getElementById('availableTeamsList');
        
        if (this.teams.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users"></i>
                    <p>No teams available. Create a team first to assign to repositories.</p>
                </div>
            `;
            return;
        }

        // Get currently assigned team IDs for this repository
        const assignedTeamIds = repo ? this.teams
            .filter(team => team.repositories.some(r => r.id === repo.id))
            .map(team => team.id) : [];

        container.innerHTML = this.teams.map(team => `
            <div class="team-checkbox-item">
                <input type="checkbox" 
                       id="team_${team.id}" 
                       value="${team.id}"
                       ${assignedTeamIds.includes(team.id) ? 'checked' : ''}>
                <div class="team-checkbox-info">
                    <div class="team-checkbox-name">${team.name}</div>
                    <div class="team-checkbox-desc">
                        ${team.description || 'No description'} • ${team.members.length} members
                    </div>
                </div>
            </div>
        `).join('');
    }

    handleRepoSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        
        const repo = {
            id: form.dataset.editId || this.generateId(),
            name: formData.get('repoName') || document.getElementById('repoName').value,
            description: formData.get('repoDescription') || document.getElementById('repoDescription').value,
            private: document.getElementById('isPrivate').checked,
            createdAt: form.dataset.editId ? this.repositories.find(r => r.id === form.dataset.editId).createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            versions: [],
            branches: ['main'],
            currentBranch: 'main',
            collaborators: [{ email: 'you@example.com', role: 'owner', addedAt: new Date().toISOString() }],
            performance: this.generatePerformanceData()
        };

        const initialPrompt = document.getElementById('initialPrompt').value;
        if (initialPrompt) {
            repo.versions.push({
                id: this.generateId(),
                message: 'Initial commit',
                content: initialPrompt,
                author: 'you@example.com',
                timestamp: new Date().toISOString(),
                branch: 'main',
                tags: ['initial'],
                performance: { accuracy: 85, speed: 120, cost: 0.05 }
            });
        }

        if (form.dataset.editId) {
            const index = this.repositories.findIndex(r => r.id === form.dataset.editId);
            this.repositories[index] = { ...this.repositories[index], ...repo };
        } else {
            this.repositories.push(repo);
        }

        // Handle team assignments
        this.updateRepoTeamAssignments(repo);

        this.saveData();
        this.renderRepositories();
        this.renderTeams();
        this.updateStats();
        this.addActivity(`${form.dataset.editId ? 'Updated' : 'Created'} repository "${repo.name}"`);
        this.closeModal('repoModal');
    }

    updateRepoTeamAssignments(repo) {
        // Get selected team IDs from checkboxes
        const selectedTeamIds = Array.from(document.querySelectorAll('#availableTeamsList input[type="checkbox"]:checked'))
            .map(checkbox => checkbox.value);

        // Remove this repository from all teams first
        this.teams.forEach(team => {
            team.repositories = team.repositories.filter(r => r.id !== repo.id);
        });

        // Add repository to selected teams
        selectedTeamIds.forEach(teamId => {
            const team = this.teams.find(t => t.id === teamId);
            if (team) {
                team.repositories.push({
                    id: repo.id,
                    name: repo.name,
                    description: repo.description,
                    addedAt: new Date().toISOString(),
                    versions: repo.versions,
                    collaborators: repo.collaborators
                });
                team.updatedAt = new Date().toISOString();
            }
        });
    }

    deleteRepository(id) {
        if (confirm('Are you sure you want to delete this repository?')) {
            const repo = this.repositories.find(r => r.id === id);
            this.repositories = this.repositories.filter(r => r.id !== id);
            this.saveData();
            this.renderRepositories();
            this.updateStats();
            this.addActivity(`Deleted repository "${repo.name}"`);
        }
    }

    openRepoDetails(id) {
        this.currentRepo = this.repositories.find(r => r.id === id);
        if (!this.currentRepo) return;

        document.getElementById('repoDetailTitle').textContent = this.currentRepo.name;
        this.populateBranchSelector();
        this.renderVersions();
        this.renderCollaborators();
        this.renderConflicts();
        this.showModal('repoDetailModal');
        
        // Show performance tab if it's active
        setTimeout(() => {
            if (document.querySelector('[data-tab="performance"]').classList.contains('active')) {
                this.renderPerformanceChart();
            }
        }, 100);
    }

    // Version Management
    openVersionModal(version = null) {
        const modal = document.getElementById('versionModal');
        const form = document.getElementById('versionForm');
        
        if (version) {
            document.getElementById('versionModalTitle').textContent = 'Edit Version';
            document.getElementById('versionMessage').value = version.message;
            document.getElementById('promptContent').value = version.content;
            document.getElementById('versionTags').value = version.tags.join(', ');
            form.dataset.editId = version.id;
        } else {
            document.getElementById('versionModalTitle').textContent = 'Create New Version';
            form.reset();
            const lastVersion = this.currentRepo.versions[this.currentRepo.versions.length - 1];
            if (lastVersion) {
                document.getElementById('promptContent').value = lastVersion.content;
            }
            delete form.dataset.editId;
        }
        
        this.showModal('versionModal');
    }

    handleVersionSubmit(e) {
        e.preventDefault();
        const form = e.target;
        
        const version = {
            id: form.dataset.editId || this.generateId(),
            message: document.getElementById('versionMessage').value,
            content: document.getElementById('promptContent').value,
            author: 'you@example.com',
            timestamp: new Date().toISOString(),
            branch: this.currentRepo.currentBranch,
            tags: document.getElementById('versionTags').value.split(',').map(t => t.trim()).filter(t => t),
            performance: this.generateVersionPerformance()
        };

        if (form.dataset.editId) {
            const index = this.currentRepo.versions.findIndex(v => v.id === form.dataset.editId);
            this.currentRepo.versions[index] = version;
        } else {
            this.currentRepo.versions.push(version);
        }

        this.currentRepo.updatedAt = new Date().toISOString();
        this.saveData();
        this.renderVersions();
        this.addActivity(`${form.dataset.editId ? 'Updated' : 'Created'} version in "${this.currentRepo.name}"`);
        this.closeModal('versionModal');
    }

    rollbackToVersion(versionId) {
        if (confirm('Are you sure you want to rollback to this version?')) {
            const version = this.currentRepo.versions.find(v => v.id === versionId);
            const newVersion = {
                ...version,
                id: this.generateId(),
                message: `Rollback to: ${version.message}`,
                timestamp: new Date().toISOString(),
                tags: ['rollback']
            };
            
            this.currentRepo.versions.push(newVersion);
            this.currentRepo.updatedAt = new Date().toISOString();
            this.saveData();
            this.renderVersions();
            this.addActivity(`Rolled back to version in "${this.currentRepo.name}"`);
        }
    }

    // Branch Management
    createBranch() {
        const branchName = prompt('Enter branch name:');
        if (branchName && !this.currentRepo.branches.includes(branchName)) {
            this.currentRepo.branches.push(branchName);
            this.populateBranchSelector();
            this.saveData();
            this.addActivity(`Created branch "${branchName}" in "${this.currentRepo.name}"`);
        }
    }

    switchBranch(branchName) {
        this.currentRepo.currentBranch = branchName;
        this.renderVersions();
        this.saveData();
    }

    handleMerge() {
        const conflicts = this.detectConflicts();
        if (conflicts.length > 0) {
            this.currentRepo.conflicts = conflicts;
            this.renderConflicts();
            this.switchTab(document.querySelector('[data-tab="conflicts"]'));
            alert('Merge conflicts detected. Please resolve them before merging.');
        } else {
            this.performMerge();
        }
    }

    detectConflicts() {
        // Simulate conflict detection
        const otherBranches = this.currentRepo.branches.filter(b => b !== this.currentRepo.currentBranch);
        if (otherBranches.length === 0) return [];

        // Simulate some conflicts
        return Math.random() > 0.7 ? [{
            id: this.generateId(),
            branches: [this.currentRepo.currentBranch, otherBranches[0]],
            files: ['prompt.txt'],
            status: 'unresolved',
            diff: [
                { type: 'remove', content: '- Old prompt content' },
                { type: 'add', content: '+ New prompt content from main' },
                { type: 'add', content: '+ New prompt content from feature' }
            ]
        }] : [];
    }

    performMerge() {
        this.addActivity(`Merged branches in "${this.currentRepo.name}"`);
        this.currentRepo.conflicts = [];
        this.renderConflicts();
        alert('Merge completed successfully!');
    }

    resolveConflict(conflictId, resolution) {
        const conflict = this.currentRepo.conflicts.find(c => c.id === conflictId);
        if (conflict) {
            conflict.status = 'resolved';
            conflict.resolution = resolution;
            this.saveData();
            this.renderConflicts();
            this.addActivity(`Resolved conflict in "${this.currentRepo.name}"`);
        }
    }

    // User Management
    updateUserDisplay() {
        document.getElementById('userName').textContent = this.userProfile.name;
    }

    toggleUserDropdown() {
        const dropdown = document.getElementById('userDropdown');
        if (dropdown) {
            dropdown.classList.toggle('show');
            console.log('User dropdown toggled');
        } else {
            console.error('User dropdown not found');
        }
    }

    closeUserDropdown() {
        const dropdown = document.getElementById('userDropdown');
        if (dropdown) {
            dropdown.classList.remove('show');
            console.log('User dropdown closed');
        } else {
            console.error('User dropdown not found');
        }
    }

    openUserProfile() {
        console.log('Opening user profile...');
        this.closeUserDropdown();
        
        // Ensure the form elements exist before setting values
        const displayName = document.getElementById('userDisplayName');
        const email = document.getElementById('userEmail');
        const bio = document.getElementById('userBio');
        const timezone = document.getElementById('userTimezone');
        
        if (displayName) displayName.value = this.userProfile.name;
        if (email) email.value = this.userProfile.email;
        if (bio) bio.value = this.userProfile.bio || '';
        if (timezone) timezone.value = this.userProfile.timezone || 'UTC';
        
        this.showModal('userProfileModal');
    }

    openUserSettings() {
        console.log('Opening user settings...');
        this.closeUserDropdown();
        
        // Ensure the form elements exist before setting values
        const darkMode = document.getElementById('darkMode');
        const language = document.getElementById('language');
        const emailNotifications = document.getElementById('emailNotifications');
        const pushNotifications = document.getElementById('pushNotifications');
        const publicProfile = document.getElementById('publicProfile');
        const analytics = document.getElementById('analytics');
        
        if (darkMode) darkMode.checked = this.userSettings.darkMode;
        if (language) language.value = this.userSettings.language;
        if (emailNotifications) emailNotifications.checked = this.userSettings.emailNotifications;
        if (pushNotifications) pushNotifications.checked = this.userSettings.pushNotifications;
        if (publicProfile) publicProfile.checked = this.userSettings.publicProfile;
        if (analytics) analytics.checked = this.userSettings.analytics;
        
        this.showModal('userSettingsModal');
    }

    handleUserProfileSubmit(e) {
        e.preventDefault();
        this.userProfile.name = document.getElementById('userDisplayName').value;
        this.userProfile.email = document.getElementById('userEmail').value;
        this.userProfile.bio = document.getElementById('userBio').value;
        this.userProfile.timezone = document.getElementById('userTimezone').value;
        this.saveUserData();
        this.updateUserDisplay();
        this.addActivity(`Updated user profile`, 'user');
        this.closeModal('userProfileModal');
    }

    handleUserSettingsSubmit(e) {
        e.preventDefault();
        this.userSettings.darkMode = document.getElementById('darkMode').checked;
        this.userSettings.language = document.getElementById('language').value;
        this.userSettings.emailNotifications = document.getElementById('emailNotifications').checked;
        this.userSettings.pushNotifications = document.getElementById('pushNotifications').checked;
        this.userSettings.publicProfile = document.getElementById('publicProfile').checked;
        this.userSettings.analytics = document.getElementById('analytics').checked;
        
        // Apply dark mode
        if (this.userSettings.darkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
        
        this.saveUserData();
        this.addActivity(`Updated settings`, 'cog');
        this.closeModal('userSettingsModal');
    }

    exportData() {
        console.log('Exporting data...');
        this.closeUserDropdown();
        const data = {
            repositories: this.repositories,
            teams: this.teams,
            userProfile: this.userProfile,
            userSettings: this.userSettings,
            activities: JSON.parse(localStorage.getItem('promptvcs_activities') || '[]'),
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `promptvcs-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        this.addActivity('Exported data', 'download');
    }

    importData() {
        console.log('Importing data...');
        this.closeUserDropdown();
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = JSON.parse(e.target.result);
                        if (confirm('This will replace all current data. Are you sure?')) {
                            this.repositories = data.repositories || [];
                            this.teams = data.teams || [];
                            this.userProfile = data.userProfile || this.userProfile;
                            this.userSettings = data.userSettings || this.userSettings;
                            this.saveData();
                            this.saveUserData();
                            this.updateUserDisplay();
                            this.renderRepositories();
                            this.renderTeams();
                            this.updateStats();
                            this.addActivity('Imported data', 'upload');
                            alert('Data imported successfully!');
                        }
                    } catch (err) {
                        alert('Invalid file format. Please select a valid PromptVCS export file.');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }

    clearAllData() {
        console.log('Clearing all data...');
        this.closeUserDropdown();
        if (confirm('This will permanently delete all your data. Are you sure?')) {
            if (confirm('This action cannot be undone. Really delete everything?')) {
                localStorage.removeItem('promptvcs_repos');
                localStorage.removeItem('promptvcs_teams');
                localStorage.removeItem('promptvcs_user');
                localStorage.removeItem('promptvcs_settings');
                localStorage.removeItem('promptvcs_activities');
                location.reload();
            }
        }
    }

    // Team Management
    openTeamModal(team = null) {
        const modal = document.getElementById('teamModal');
        const form = document.getElementById('teamForm');
        
        if (team) {
            document.getElementById('teamModalTitle').textContent = 'Edit Team';
            document.getElementById('teamName').value = team.name;
            document.getElementById('teamDescription').value = team.description;
            document.getElementById('teamMembers').value = team.members.map(m => m.email).join(', ');
            form.dataset.editId = team.id;
        } else {
            document.getElementById('teamModalTitle').textContent = 'Create Team';
            form.reset();
            delete form.dataset.editId;
        }
        
        this.showModal('teamModal');
    }

    handleTeamSubmit(e) {
        e.preventDefault();
        const form = e.target;
        
        const team = {
            id: form.dataset.editId || this.generateId(),
            name: document.getElementById('teamName').value,
            description: document.getElementById('teamDescription').value,
            private: false,
            members: [],
            repositories: [],
            createdAt: form.dataset.editId ? this.teams.find(t => t.id === form.dataset.editId).createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Add team members
        const memberEmails = document.getElementById('teamMembers').value.split(',').map(email => email.trim()).filter(email => email);
        memberEmails.forEach(email => {
            team.members.push({
                email: email,
                role: email === this.userProfile.email ? 'admin' : 'member',
                joinedAt: new Date().toISOString()
            });
        });

        // Add current user as admin if not already added
        if (!team.members.find(m => m.email === this.userProfile.email)) {
            team.members.unshift({
                email: this.userProfile.email,
                role: 'admin',
                joinedAt: new Date().toISOString()
            });
        }

        if (form.dataset.editId) {
            const index = this.teams.findIndex(t => t.id === form.dataset.editId);
            this.teams[index] = { ...this.teams[index], ...team };
        } else {
            this.teams.push(team);
        }

        this.saveData();
        this.renderTeams();
        this.updateStats();
        this.addActivity(`${form.dataset.editId ? 'Updated' : 'Created'} team "${team.name}"`);
        this.closeModal('teamModal');
    }

    openTeamDetails(id) {
        this.currentTeam = this.teams.find(t => t.id === id);
        if (!this.currentTeam) return;

        document.getElementById('teamDetailTitle').textContent = this.currentTeam.name;
        this.populateAvailableRepos();
        this.renderTeamMembers();
        this.renderTeamRepos();
        this.populateTeamSettings();
        this.showModal('teamDetailModal');
    }

    populateAvailableRepos() {
        const selector = document.getElementById('availableRepos');
        const teamRepoIds = this.currentTeam.repositories.map(r => r.id);
        const availableRepos = this.repositories.filter(r => !teamRepoIds.includes(r.id));
        
        selector.innerHTML = '<option value="">Select a repository to add</option>' + 
            availableRepos.map(repo => `<option value="${repo.id}">${repo.name}</option>`).join('');
    }

    renderTeamMembers() {
        const container = document.getElementById('teamMembersList');
        
        container.innerHTML = this.currentTeam.members.map(member => `
            <div class="member-item">
                <div class="member-info">
                    <div class="member-avatar">${member.email.charAt(0).toUpperCase()}</div>
                    <div class="member-details">
                        <h4>${member.email}</h4>
                        <p>Joined ${this.formatDate(member.joinedAt)}</p>
                    </div>
                </div>
                <div class="member-actions">
                    <span class="member-role ${member.role}">${member.role}</span>
                    ${member.role !== 'admin' || this.currentTeam.members.filter(m => m.role === 'admin').length > 1 ? `
                        <button class="btn btn-danger" onclick="promptVCS.removeTeamMember('${member.email}')">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    renderTeamRepos() {
        const container = document.getElementById('teamReposList');
        
        if (this.currentTeam.repositories.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-folder-open"></i>
                    <h3>No repositories</h3>
                    <p>Add repositories to give team members access.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.currentTeam.repositories.map(repo => `
            <div class="team-repo-item">
                <div class="repo-info">
                    <h4>${repo.name}</h4>
                    <p>${repo.description || 'No description'}</p>
                    <div class="repo-meta">
                        <span><i class="fas fa-code-branch"></i> ${repo.versions?.length || 0} versions</span>
                        <span><i class="fas fa-users"></i> ${repo.collaborators?.length || 0} collaborators</span>
                    </div>
                </div>
                <button class="btn btn-danger" onclick="promptVCS.removeRepoFromTeam('${repo.id}')">
                    <i class="fas fa-times"></i> Remove
                </button>
            </div>
        `).join('');
    }

    populateTeamSettings() {
        document.getElementById('editTeamName').value = this.currentTeam.name;
        document.getElementById('editTeamDescription').value = this.currentTeam.description;
        document.getElementById('teamPrivate').checked = this.currentTeam.private;
    }

    addTeamMember() {
        const email = document.getElementById('newMemberEmail').value.trim();
        const role = document.getElementById('memberRole').value;
        
        if (!email) return;
        
        if (this.currentTeam.members.find(m => m.email === email)) {
            alert('This user is already a team member.');
            return;
        }

        this.currentTeam.members.push({
            email: email,
            role: role,
            joinedAt: new Date().toISOString()
        });

        this.saveData();
        this.renderTeamMembers();
        this.addActivity(`Added ${email} to team "${this.currentTeam.name}"`);
        document.getElementById('newMemberEmail').value = '';
    }

    removeTeamMember(email) {
        if (confirm('Remove this team member?')) {
            this.currentTeam.members = this.currentTeam.members.filter(m => m.email !== email);
            this.saveData();
            this.renderTeamMembers();
            this.addActivity(`Removed ${email} from team "${this.currentTeam.name}"`);
        }
    }

    addRepoToTeam() {
        const repoId = document.getElementById('availableRepos').value;
        if (!repoId) return;

        const repo = this.repositories.find(r => r.id === repoId);
        if (!repo) return;

        this.currentTeam.repositories.push({
            id: repo.id,
            name: repo.name,
            description: repo.description,
            addedAt: new Date().toISOString(),
            versions: repo.versions,
            collaborators: repo.collaborators
        });

        this.saveData();
        this.populateAvailableRepos();
        this.renderTeamRepos();
        this.addActivity(`Added repository "${repo.name}" to team "${this.currentTeam.name}"`);
    }

    removeRepoFromTeam(repoId) {
        if (confirm('Remove this repository from the team?')) {
            this.currentTeam.repositories = this.currentTeam.repositories.filter(r => r.id !== repoId);
            this.saveData();
            this.populateAvailableRepos();
            this.renderTeamRepos();
            this.addActivity(`Removed repository from team "${this.currentTeam.name}"`);
        }
    }

    handleTeamSettingsSubmit(e) {
        e.preventDefault();
        this.currentTeam.name = document.getElementById('editTeamName').value;
        this.currentTeam.description = document.getElementById('editTeamDescription').value;
        this.currentTeam.private = document.getElementById('teamPrivate').checked;
        this.currentTeam.updatedAt = new Date().toISOString();
        
        this.saveData();
        this.renderTeams();
        this.addActivity(`Updated team settings for "${this.currentTeam.name}"`);
        this.closeModal('teamDetailModal');
    }

    // Utility Methods
    saveUserData() {
        localStorage.setItem('promptvcs_user', JSON.stringify(this.userProfile));
        localStorage.setItem('promptvcs_settings', JSON.stringify(this.userSettings));
    }

    loadUserData() {
        const savedProfile = localStorage.getItem('promptvcs_user');
        const savedSettings = localStorage.getItem('promptvcs_settings');
        
        if (savedProfile) {
            this.userProfile = { ...this.userProfile, ...JSON.parse(savedProfile) };
        }
        
        if (savedSettings) {
            this.userSettings = { ...this.userSettings, ...JSON.parse(savedSettings) };
        }
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString();
    }

    addCollaborator() {
        const email = document.getElementById('collaboratorEmail').value;
        if (email && this.currentRepo) {
            const collaborator = {
                email: email,
                role: 'contributor',
                addedAt: new Date().toISOString()
            };
            
            this.currentRepo.collaborators.push(collaborator);
            this.saveData();
            this.renderCollaborators();
            this.addActivity(`Added collaborator to "${this.currentRepo.name}"`);
            document.getElementById('collaboratorEmail').value = '';
        }
    }

    removeCollaborator(email) {
        if (confirm('Remove this collaborator?')) {
            this.currentRepo.collaborators = this.currentRepo.collaborators.filter(c => c.email !== email);
            this.saveData();
            this.renderCollaborators();
            this.addActivity(`Removed collaborator from "${this.currentRepo.name}"`);
        }
    }

    // Rendering Methods
    renderRepositories() {
        const container = document.getElementById('repositoryList');
        
        if (this.repositories.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-folder-open"></i>
                    <h3>No repositories yet</h3>
                    <p>Create your first repository to start managing prompts with version control.</p>
                    <button class="btn btn-primary" onclick="promptVCS.openRepoModal()">
                        <i class="fas fa-plus"></i> Create Repository
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = this.repositories.map(repo => `
            <div class="repo-card">
                <div class="repo-header">
                    <div>
                        <div class="repo-title">${repo.name}</div>
                        ${repo.private ? '<span class="badge badge-warning">Private</span>' : '<span class="badge badge-success">Public</span>'}
                    </div>
                    <div class="repo-actions">
                        <button class="btn btn-secondary" onclick="promptVCS.openRepoDetails('${repo.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-secondary" onclick="promptVCS.openRepoModal(promptVCS.repositories.find(r => r.id === '${repo.id}'))">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-danger" onclick="promptVCS.deleteRepository('${repo.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="repo-description">${repo.description || 'No description'}</div>
                <div class="repo-stats">
                    <div class="stat">
                        <i class="fas fa-code-branch"></i>
                        ${repo.versions.length} versions
                    </div>
                    <div class="stat">
                        <i class="fas fa-users"></i>
                        ${repo.collaborators.length} collaborators
                    </div>
                    <div class="stat">
                        <i class="fas fa-clock"></i>
                        ${this.formatDate(repo.updatedAt)}
                    </div>
                </div>
                <div class="repo-meta">
                    <span>Branch: ${repo.currentBranch}</span>
                    <span>Performance: ${this.getAvgPerformance(repo)}%</span>
                </div>
            </div>
        `).join('');
    }

    renderVersions() {
        const container = document.getElementById('versionsList');
        const currentBranch = document.getElementById('branchSelector').value || 'main';
        const versions = this.currentRepo.versions.filter(v => v.branch === currentBranch);

        if (versions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-code-branch"></i>
                    <h3>No versions in this branch</h3>
                    <p>Create your first version to start tracking prompt changes.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = versions.reverse().map(version => `
            <div class="version-item">
                <div class="version-header">
                    <div>
                        <span class="version-id">${version.id.substring(0, 8)}</span>
                        <span class="version-message">${version.message}</span>
                    </div>
                    <div class="version-actions">
                        <button class="btn btn-secondary" onclick="promptVCS.openVersionModal(promptVCS.currentRepo.versions.find(v => v.id === '${version.id}'))">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-success" onclick="promptVCS.rollbackToVersion('${version.id}')">
                            <i class="fas fa-undo"></i> Rollback
                        </button>
                    </div>
                </div>
                <div class="version-meta">
                    <span><i class="fas fa-user"></i> ${version.author}</span>
                    <span><i class="fas fa-clock"></i> ${this.formatDate(version.timestamp)}</span>
                    <span><i class="fas fa-chart-line"></i> ${version.performance.accuracy}% accuracy</span>
                </div>
                ${version.tags.length > 0 ? `
                    <div class="version-tags">
                        ${version.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                ` : ''}
                <div class="version-content">
                    <pre>${version.content}</pre>
                </div>
            </div>
        `).join('');
    }

    renderCollaborators() {
        const container = document.getElementById('collaboratorsList');
        
        container.innerHTML = this.currentRepo.collaborators.map(collab => `
            <div class="collaborator-item">
                <div>
                    <strong>${collab.email}</strong>
                    <span class="badge badge-info">${collab.role}</span>
                    <small>Added ${this.formatDate(collab.addedAt)}</small>
                </div>
                ${collab.role !== 'owner' ? `
                    <button class="btn btn-danger" onclick="promptVCS.removeCollaborator('${collab.email}')">
                        <i class="fas fa-times"></i>
                    </button>
                ` : ''}
            </div>
        `).join('');
    }

    renderConflicts() {
        const container = document.getElementById('conflictsList');
        const conflicts = this.currentRepo.conflicts || [];
        
        if (conflicts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-check-circle"></i>
                    <h3>No conflicts</h3>
                    <p>All branches can be merged cleanly.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = conflicts.map(conflict => `
            <div class="conflict-item">
                <div class="conflict-header">
                    <h4>Conflict in ${conflict.files.join(', ')}</h4>
                    <span class="badge ${conflict.status === 'resolved' ? 'badge-success' : 'badge-danger'}">
                        ${conflict.status}
                    </span>
                </div>
                <div class="conflict-files">
                    <strong>Branches:</strong> ${conflict.branches.join(' ↔ ')}
                </div>
                <div class="conflict-diff">
                    ${conflict.diff.map(line => `
                        <div class="diff-line ${line.type === 'add' ? 'diff-add' : line.type === 'remove' ? 'diff-remove' : ''}">
                            ${line.content}
                        </div>
                    `).join('')}
                </div>
                ${conflict.status === 'unresolved' ? `
                    <div class="conflict-actions">
                        <button class="btn btn-success" onclick="promptVCS.resolveConflict('${conflict.id}', 'main')">
                            Accept Main
                        </button>
                        <button class="btn btn-success" onclick="promptVCS.resolveConflict('${conflict.id}', 'incoming')">
                            Accept Incoming
                        </button>
                        <button class="btn btn-primary" onclick="promptVCS.resolveConflict('${conflict.id}', 'manual')">
                            Resolve Manually
                        </button>
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    renderTeams() {
        const container = document.getElementById('teamsList');
        
        if (this.teams.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users"></i>
                    <h3>No teams yet</h3>
                    <p>Create a team to collaborate with others on prompt development.</p>
                    <button class="btn btn-primary" onclick="promptVCS.openTeamModal()">
                        <i class="fas fa-plus"></i> Create Team
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = this.teams.map(team => `
            <div class="team-card">
                <h3>${team.name}</h3>
                <p>${team.description || 'No description'}</p>
                <div class="team-stats">
                    <div class="stat">
                        <i class="fas fa-users"></i>
                        ${team.members.length} members
                    </div>
                    <div class="stat">
                        <i class="fas fa-folder"></i>
                        ${team.repositories.length} repositories
                    </div>
                </div>
                <div class="team-actions">
                    <button class="btn btn-primary" onclick="promptVCS.openTeamDetails('${team.id}')">
                        <i class="fas fa-cog"></i> Manage
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderPerformanceChart() {
        const ctx = document.getElementById('performanceChart');
        if (!ctx || !this.currentRepo) return;

        const versions = this.currentRepo.versions.slice(-10); // Last 10 versions
        
        if (this.performanceChart) {
            this.performanceChart.destroy();
        }

        this.performanceChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: versions.map((v, i) => `v${i + 1}`),
                datasets: [
                    {
                        label: 'Accuracy (%)',
                        data: versions.map(v => v.performance.accuracy),
                        borderColor: '#4f46e5',
                        backgroundColor: 'rgba(79, 70, 229, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: 'Speed (ms)',
                        data: versions.map(v => v.performance.speed),
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Performance Over Time'
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Accuracy (%)'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Speed (ms)'
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                    }
                }
            }
        });
    }

    // Utility Methods
    populateBranchSelector() {
        const selector = document.getElementById('branchSelector');
        selector.innerHTML = this.currentRepo.branches.map(branch => 
            `<option value="${branch}" ${branch === this.currentRepo.currentBranch ? 'selected' : ''}>${branch}</option>`
        ).join('');
        
        selector.addEventListener('change', (e) => {
            this.switchBranch(e.target.value);
        });
    }

    switchTab(tabBtn) {
        const tabName = tabBtn.dataset.tab;
        
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        tabBtn.classList.add('active');
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(tabName + 'Tab').classList.add('active');
        
        // Special handling for performance tab
        if (tabName === 'performance') {
            setTimeout(() => this.renderPerformanceChart(), 100);
        }
    }

    updateStats() {
        document.getElementById('repoCount').textContent = this.repositories.length;
        document.getElementById('branchCount').textContent = this.repositories.reduce((total, repo) => total + repo.branches.length, 0);
        document.getElementById('collaboratorCount').textContent = this.repositories.reduce((total, repo) => total + repo.collaborators.length, 0);
        document.getElementById('performanceScore').textContent = this.getOverallPerformance() + '%';
    }

    updateActivity() {
        const activities = JSON.parse(localStorage.getItem('promptvcs_activities') || '[]');
        const container = document.getElementById('activityList');
        
        if (activities.length === 0) {
            return; // Keep the welcome message
        }

        container.innerHTML = activities.slice(-5).reverse().map(activity => `
            <div class="activity-item">
                <i class="fas fa-${activity.icon || 'info-circle'}"></i>
                <p>${activity.message}</p>
                <span class="activity-time">${this.formatDate(activity.timestamp)}</span>
            </div>
        `).join('');
    }

    addActivity(message, icon = 'info-circle') {
        const activities = JSON.parse(localStorage.getItem('promptvcs_activities') || '[]');
        activities.push({
            message,
            icon,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('promptvcs_activities', JSON.stringify(activities));
        this.updateActivity();
    }

    getAvgPerformance(repo) {
        if (repo.versions.length === 0) return 0;
        const total = repo.versions.reduce((sum, v) => sum + v.performance.accuracy, 0);
        return Math.round(total / repo.versions.length);
    }

    getOverallPerformance() {
        if (this.repositories.length === 0) return 0;
        const allVersions = this.repositories.flatMap(repo => repo.versions);
        if (allVersions.length === 0) return 0;
        const total = allVersions.reduce((sum, v) => sum + v.performance.accuracy, 0);
        return Math.round(total / allVersions.length);
    }

    generatePerformanceData() {
        return {
            accuracy: Math.round(Math.random() * 20 + 80), // 80-100%
            speed: Math.round(Math.random() * 200 + 50),   // 50-250ms
            cost: Math.round((Math.random() * 0.1 + 0.01) * 100) / 100 // $0.01-$0.11
        };
    }

    generateVersionPerformance() {
        return {
            accuracy: Math.round(Math.random() * 25 + 75), // 75-100%
            speed: Math.round(Math.random() * 300 + 50),   // 50-350ms
            cost: Math.round((Math.random() * 0.15 + 0.01) * 100) / 100 // $0.01-$0.16
        };
    }

    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return date.toLocaleDateString();
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
            console.log(`Modal ${modalId} opened successfully`);
        } else {
            console.error(`Modal ${modalId} not found`);
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = 'auto';
            console.log(`Modal ${modalId} closed successfully`);
        } else {
            console.error(`Modal ${modalId} not found`);
        }
    }

    saveData() {
        localStorage.setItem('promptvcs_repos', JSON.stringify(this.repositories));
        localStorage.setItem('promptvcs_teams', JSON.stringify(this.teams));
    }
}

// Initialize the application
// Initialize the app
const promptVCS = new PromptVCS();

// Make it globally available for onclick handlers
window.promptVCS = promptVCS;

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    promptVCS.init();
});

// Handle modal clicks outside content
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        const modalId = e.target.id;
        promptVCS.closeModal(modalId);
    }
});

// Handle escape key to close modals
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const openModal = document.querySelector('.modal.show');
        if (openModal) {
            promptVCS.closeModal(openModal.id);
        }
    }
});

// Demo data for first-time users
if (promptVCS.repositories.length === 0) {
    // Add some demo data after a short delay
    setTimeout(() => {
        if (promptVCS.repositories.length === 0) {
            const demoRepo = {
                id: promptVCS.generateId(),
                name: 'Customer Support Bot',
                description: 'AI prompts for handling customer inquiries and support tickets',
                private: false,
                createdAt: new Date(Date.now() - 86400000 * 3).toISOString(), // 3 days ago
                updatedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
                versions: [
                    {
                        id: promptVCS.generateId(),
                        message: 'Initial customer support prompt',
                        content: 'You are a helpful customer support assistant. Always be polite, professional, and aim to resolve customer issues quickly.',
                        author: 'you@example.com',
                        timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
                        branch: 'main',
                        tags: ['initial', 'production'],
                        performance: { accuracy: 82, speed: 150, cost: 0.08 }
                    },
                    {
                        id: promptVCS.generateId(),
                        message: 'Added empathy and escalation guidelines',
                        content: 'You are a helpful customer support assistant. Always be polite, professional, and empathetic. For complex issues, guide customers to escalation procedures. Aim to resolve issues quickly while ensuring customer satisfaction.',
                        author: 'you@example.com',
                        timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
                        branch: 'main',
                        tags: ['improvement', 'empathy'],
                        performance: { accuracy: 89, speed: 120, cost: 0.09 }
                    },
                    {
                        id: promptVCS.generateId(),
                        message: 'Optimized for speed and accuracy',
                        content: 'You are a helpful customer support assistant. Be polite, professional, and empathetic. For complex issues, use escalation procedures. Prioritize quick resolution while maintaining high customer satisfaction. Use structured responses for common queries.',
                        author: 'you@example.com',
                        timestamp: new Date(Date.now() - 3600000).toISOString(),
                        branch: 'main',
                        tags: ['optimization', 'production'],
                        performance: { accuracy: 94, speed: 95, cost: 0.07 }
                    }
                ],
                branches: ['main', 'feature/multilingual'],
                currentBranch: 'main',
                collaborators: [
                    { email: 'you@example.com', role: 'owner', addedAt: new Date(Date.now() - 86400000 * 3).toISOString() },
                    { email: 'teammate@example.com', role: 'contributor', addedAt: new Date(Date.now() - 86400000 * 2).toISOString() }
                ],
                performance: promptVCS.generatePerformanceData()
            };

            promptVCS.repositories.push(demoRepo);
            
            // Also create a demo team
            const demoTeam = {
                id: promptVCS.generateId(),
                name: 'A-Team',
                description: 'Main development team for AI prompt engineering',
                private: false,
                members: [
                    { email: 'you@example.com', role: 'admin', joinedAt: new Date(Date.now() - 86400000 * 5).toISOString() },
                    { email: 'alice@example.com', role: 'member', joinedAt: new Date(Date.now() - 86400000 * 3).toISOString() },
                    { email: 'bob@example.com', role: 'member', joinedAt: new Date(Date.now() - 86400000 * 2).toISOString() }
                ],
                repositories: [
                    {
                        id: demoRepo.id,
                        name: demoRepo.name,
                        description: demoRepo.description,
                        addedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
                        versions: demoRepo.versions,
                        collaborators: demoRepo.collaborators
                    }
                ],
                createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
                updatedAt: new Date(Date.now() - 86400000).toISOString()
            };
            
            promptVCS.teams.push(demoTeam);
            promptVCS.saveData();
            promptVCS.renderRepositories();
            promptVCS.renderTeams();
            promptVCS.updateStats();
            promptVCS.addActivity('Demo repository created', 'star');
            promptVCS.addActivity('Demo team created', 'users');
        }
    }, 2000);
}
