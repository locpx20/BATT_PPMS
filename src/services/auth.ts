/**
 * BATT PPMS - Authentication & Session Service
 * Handles Login, Profile Update, Password Change, Forgot Password OTP and Active Role Management
 */

import { User, RoleCode } from '../types';
import { db, INITIAL_USERS } from './db';

const SESSION_KEY = 'batt_ppms_session_v6';
const PASSWORDS_KEY = 'batt_ppms_passwords_v6';

class AuthService {
  private currentUser: User | null = null;
  private listeners: ((user: User | null) => void)[] = [];

  constructor() {
    this.initPasswords();
    this.loadSession();
  }

  private initPasswords() {
    if (!localStorage.getItem(PASSWORDS_KEY)) {
      // Default initial password for all accounts in dev/test is 123456
      const passwords: Record<string, string> = {};
      INITIAL_USERS.forEach((u) => {
        passwords[u.username] = '123456';
      });
      localStorage.setItem(PASSWORDS_KEY, JSON.stringify(passwords));
    }
  }

  private getStoredPasswords(): Record<string, string> {
    try {
      const data = localStorage.getItem(PASSWORDS_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  private setStoredPasswords(passwords: Record<string, string>) {
    localStorage.setItem(PASSWORDS_KEY, JSON.stringify(passwords));
  }

  private loadSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const stored = JSON.parse(raw);
        // Find latest user data from DB
        const dbUsers = db.getSnapshot().users;
        const freshUser = dbUsers.find((u) => u.id === stored.id);
        if (freshUser && freshUser.isActive) {
          this.currentUser = freshUser;
          return;
        }
      }
    } catch {
      // ignore
    }
    // Default to Owner if no session so user lands immediately in a productive operational view
    const owner = db.getSnapshot().users.find((u) => u.role === 'O');
    this.currentUser = owner || INITIAL_USERS[0];
  }

  public subscribe(listener: (user: User | null) => void): () => void {
    this.listeners.push(listener);
    listener(this.currentUser);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      listener(this.currentUser);
    }
  }

  public getCurrentUser(): User | null {
    if (!this.currentUser) return null;
    // Always refresh against current db state
    const current = db.getSnapshot().users.find((u) => u.id === this.currentUser!.id);
    return current || this.currentUser;
  }

  public login(username: string, password: string): { success: boolean; error?: string; user?: User } {
    const user = db.getSnapshot().users.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());
    if (!user) {
      return { success: false, error: 'Tên đăng nhập không tồn tại trên hệ thống' };
    }
    if (!user.isActive) {
      return { success: false, error: 'Tài khoản đã bị tạm khóa. Vui lòng liên hệ Quản trị viên Hệ thống' };
    }

    const passwords = this.getStoredPasswords();
    const storedPass = passwords[user.username] || '123456';
    if (password !== storedPass) {
      return { success: false, error: 'Mật khẩu không chính xác' };
    }

    this.currentUser = user;
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    this.notify();
    return { success: true, user };
  }

  /**
   * Fast Actor Switcher for enterprise evaluation:
   * Enables immediate testing of all 8 roles without re-logging
   */
  public switchRole(role: RoleCode): { success: boolean; user?: User } {
    const targetUser = db.getSnapshot().users.find((u) => u.role === role && u.isActive);
    if (!targetUser) return { success: false };

    this.currentUser = targetUser;
    localStorage.setItem(SESSION_KEY, JSON.stringify(targetUser));
    this.notify();
    return { success: true, user: targetUser };
  }

  public logout() {
    this.currentUser = null;
    localStorage.removeItem(SESSION_KEY);
    this.notify();
  }

  public updateProfile(params: { fullName: string; phone: string; email: string; avatarUrl?: string }): {
    success: boolean;
    error?: string;
  } {
    if (!this.currentUser) return { success: false, error: 'Chưa đăng nhập' };

    const res = db.updateUserProfile(this.currentUser.id, params);
    if (res.success) {
      this.currentUser = {
        ...this.currentUser,
        fullName: params.fullName,
        phone: params.phone,
        email: params.email,
        avatarUrl: params.avatarUrl || this.currentUser.avatarUrl,
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(this.currentUser));
      this.notify();
    }
    return res;
  }

  public changePassword(
    currentPass: string,
    newPass: string,
    confirmPass: string
  ): { success: boolean; error?: string } {
    if (!this.currentUser) return { success: false, error: 'Chưa đăng nhập' };
    if (!newPass || newPass.length < 6) {
      return { success: false, error: 'Mật khẩu mới phải có ít nhất 6 ký tự' };
    }
    if (newPass !== confirmPass) {
      return { success: false, error: 'Xác nhận mật khẩu mới không trùng khớp' };
    }

    const passwords = this.getStoredPasswords();
    const currentStored = passwords[this.currentUser.username] || '123456';
    if (currentPass !== currentStored) {
      return { success: false, error: 'Mật khẩu hiện tại không đúng' };
    }

    passwords[this.currentUser.username] = newPass;
    this.setStoredPasswords(passwords);
    return { success: true };
  }

  public checkUsernameExists(username: string): { success: boolean; error?: string; user?: User } {
    const user = db.getSnapshot().users.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());
    if (!user) {
      return { success: false, error: 'Không tìm thấy tài khoản tương ứng' };
    }
    if (!user.isActive) {
      return { success: false, error: 'Tài khoản đang bị tạm khóa' };
    }
    return { success: true, user };
  }

  public verifyOtp(username: string, otpCode: string): { success: boolean; error?: string } {
    const user = db.getSnapshot().users.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());
    if (!user) {
      return { success: false, error: 'Tài khoản không hợp lệ' };
    }
    // Test OTP accepted: 123 (or standard 6-digit test codes)
    if (otpCode.trim() !== '123' && otpCode.trim() !== '123456') {
      return { success: false, error: 'Mã xác thực OTP không chính xác hoặc đã hết hiệu lực' };
    }
    return { success: true };
  }

  public resetPasswordWithOtp(
    username: string,
    otpCode: string,
    newPassword: string
  ): { success: boolean; error?: string } {
    const user = db.getSnapshot().users.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());
    if (!user) {
      return { success: false, error: 'Không tìm thấy tài khoản tương ứng' };
    }
    if (otpCode.trim() !== '123' && otpCode.trim() !== '123456') {
      return { success: false, error: 'Mã xác thực OTP không chính xác hoặc đã hết hiệu lực' };
    }
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'Mật khẩu mới phải có tối thiểu 6 ký tự' };
    }

    const passwords = this.getStoredPasswords();
    passwords[user.username] = newPassword;
    this.setStoredPasswords(passwords);
    return { success: true };
  }
}

export const auth = new AuthService();
