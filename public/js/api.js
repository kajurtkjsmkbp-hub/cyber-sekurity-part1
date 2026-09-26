// API Client Helper
const API = {
  async request(endpoint, options = {}) {
    const defaultHeaders = {
      'Content-Type': 'application/json'
    };

    try {
      const response = await fetch(endpoint, {
        credentials: 'include',
        ...options,
        headers: {
          ...defaultHeaders,
          ...(options.headers || {})
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Terjadi kesalahan pada server');
      }
      return data;
    } catch (err) {
      console.error(`API Error [${endpoint}]:`, err);
      throw err;
    }
  },

  // Auth
  async login(username, password) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  },

  async register(username, full_name, email, password) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, full_name, email, password })
    });
  },

  async getMe() {
    return this.request('/api/auth/me');
  },

  async logout() {
    return this.request('/api/auth/logout', { method: 'POST' });
  },

  async updateProfile(profileData) {
    return this.request('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  },

  // Student / Curriculum
  async getCurriculum() {
    return this.request('/api/curriculum');
  },

  async getModule(id) {
    return this.request(`/api/modules/${id}`);
  },

  async markModuleRead(id) {
    return this.request(`/api/modules/${id}/mark-read`, { method: 'POST' });
  },

  async submitQuiz(id, answers) {
    return this.request(`/api/modules/${id}/quiz/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers })
    });
  },

  async requestRemedial(id) {
    return this.request(`/api/modules/${id}/quiz/request-remedial`, {
      method: 'POST'
    });
  },

  async submitFlag(id, flag, difficulty = null) {
    return this.request(`/api/modules/${id}/lab/submit-flag`, {
      method: 'POST',
      body: JSON.stringify({ flag, difficulty })
    });
  },

  async getStudentDashboard() {
    return this.request('/api/student/dashboard');
  },

  // Guru
  async getGuruOverview() {
    return this.request('/api/guru/overview');
  },

  async getGuruStudents() {
    return this.request('/api/guru/students');
  },

  async getGuruStudentDetail(id) {
    return this.request(`/api/guru/students/${id}`);
  },

  async createStudent(studentData) {
    return this.request('/api/guru/students', {
      method: 'POST',
      body: JSON.stringify(studentData)
    });
  },

  async editStudent(id, studentData) {
    return this.request(`/api/guru/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(studentData)
    });
  },

  async resetStudentPassword(id, newPassword) {
    return this.request(`/api/guru/students/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ new_password: newPassword })
    });
  },

  async toggleStudentStatus(id, isActive) {
    return this.request(`/api/guru/students/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: isActive })
    });
  },

  async deleteStudent(id) {
    return this.request(`/api/guru/students/${id}`, {
      method: 'DELETE'
    });
  },

  // Guru - Team / Teacher Management
  async getGuruTeachers() {
    return this.request('/api/guru/teachers');
  },

  async createTeacher(teacherData) {
    return this.request('/api/guru/teachers', {
      method: 'POST',
      body: JSON.stringify(teacherData)
    });
  },

  async editTeacher(id, teacherData) {
    return this.request(`/api/guru/teachers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(teacherData)
    });
  },

  async toggleTeacherStatus(id, isActive) {
    return this.request(`/api/guru/teachers/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: isActive })
    });
  },

  async deleteTeacher(id) {
    return this.request(`/api/guru/teachers/${id}`, {
      method: 'DELETE'
    });
  },

  // Mock Lab Endpoints
  async evalSqli(username, password, usePrepared = false) {
    return this.request('/api/mock-lab/sqli-eval', {
      method: 'POST',
      body: JSON.stringify({ username, password, usePrepared })
    });
  },

  // Announcements
  async getAnnouncements() {
    return this.request('/api/announcements');
  },

  async createAnnouncement(data) {
    return this.request('/api/announcements', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async deleteAnnouncement(id) {
    return this.request(`/api/announcements/${id}`, {
      method: 'DELETE'
    });
  },

  // Discussions
  async getDiscussions(moduleId) {
    return this.request(`/api/modules/${moduleId}/discussions`);
  },

  async postDiscussion(moduleId, message) {
    return this.request(`/api/modules/${moduleId}/discussions`, {
      method: 'POST',
      body: JSON.stringify({ message })
    });
  },

  // Certificates & Public Verification
  async getMyCertificate() {
    return this.request('/api/certificate/my');
  },

  async claimCertificate() {
    return this.request('/api/certificate/claim', {
      method: 'POST'
    });
  },

  async verifyCertificate(serial) {
    return this.request(`/api/certificate/verify/${encodeURIComponent(serial)}`);
  },

  // Leaderboard & Badges
  async getLeaderboard() {
    return this.request('/api/leaderboard');
  },

  // Transcript & Skill Matrix
  async getStudentTranscript(studentId) {
    return this.request(`/api/student/${studentId}/transcript`);
  }
};
