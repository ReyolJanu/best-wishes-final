/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { toast } from 'react-hot-toast';
import CreateUserForm from '../components/CreateUserForm';

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn()
  }
}));

// Mock fetch
global.fetch = jest.fn();

// Mock environment variables
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:5000/api';

describe('CreateUserForm', () => {
  const mockOnSuccess = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockClear();
  });

  const renderComponent = (props = {}) => {
    return render(
      <CreateUserForm
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
        {...props}
      />
    );
  };

  it('renders form with all required fields', () => {
    renderComponent();

    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByText(/select role/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create user/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    renderComponent();

    const submitButton = screen.getByRole('button', { name: /create user/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('First name is required')).toBeInTheDocument();
      expect(screen.getByText('Last name is required')).toBeInTheDocument();
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
      expect(screen.getByText('Role is required')).toBeInTheDocument();
    });

    expect(toast.error).toHaveBeenCalledWith('Please fix the errors in the form');
  });

  it('validates email format', async () => {
    renderComponent();

    const emailInput = screen.getByLabelText(/email address/i);
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

    const submitButton = screen.getByRole('button', { name: /create user/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  it('validates password strength', async () => {
    renderComponent();

    const passwordInput = screen.getByLabelText(/^password/i);
    
    // Test short password
    fireEvent.change(passwordInput, { target: { value: 'short' } });
    fireEvent.blur(passwordInput);

    const submitButton = screen.getByRole('button', { name: /create user/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters long')).toBeInTheDocument();
    });

    // Test password without number
    fireEvent.change(passwordInput, { target: { value: 'NoNumberPass!' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Password must contain at least one number')).toBeInTheDocument();
    });

    // Test password without symbol
    fireEvent.change(passwordInput, { target: { value: 'NoSymbolPass123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Password must contain at least one symbol')).toBeInTheDocument();
    });
  });

  it('validates password confirmation', async () => {
    renderComponent();

    const passwordInput = screen.getByLabelText(/^password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

    fireEvent.change(passwordInput, { target: { value: 'ValidPass123!' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'DifferentPass123!' } });

    const submitButton = screen.getByRole('button', { name: /create user/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  it('checks email uniqueness via API', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        available: false,
        message: 'Email is already in use'
      })
    });

    renderComponent();

    // Fill in form with existing email
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'User' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'existing@test.com' } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'ValidPass123!' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'ValidPass123!' } });

    // Trigger role selection
    const roleSelect = screen.getByRole('combobox');
    fireEvent.click(roleSelect);
    const adminOption = screen.getByText('Admin');
    fireEvent.click(adminOption);

    const submitButton = screen.getByRole('button', { name: /create user/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/admin/users/check-email/existing%40test.com',
        { credentials: 'include' }
      );
      expect(screen.getByText('This email is already in use')).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const mockUser = {
      _id: 'test-id',
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      role: 'deliveryStaff'
    };

    // Mock email uniqueness check
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        available: true,
        message: 'Email is available'
      })
    });

    // Mock create user API
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        message: 'User created successfully',
        user: mockUser
      })
    });

    renderComponent();

    // Fill in form
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'User' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'ValidPass123!' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'ValidPass123!' } });

    // Select role
    const roleSelect = screen.getByRole('combobox');
    fireEvent.click(roleSelect);
    const deliveryOption = screen.getByText('Delivery Staff');
    fireEvent.click(deliveryOption);

    const submitButton = screen.getByRole('button', { name: /create user/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/admin/users',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            password: 'ValidPass123!',
            role: 'deliveryStaff',
            phone: '',
            address: '',
            profileImage: '',
            twoFactorEnabled: false,
            isBlocked: false
          })
        })
      });

      expect(toast.success).toHaveBeenCalledWith('User created successfully!');
      expect(mockOnSuccess).toHaveBeenCalledWith(mockUser);
    });
  });

  it('handles API errors gracefully', async () => {
    // Mock email uniqueness check to pass
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        available: true,
        message: 'Email is available'
      })
    });

    // Mock create user API to fail
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        success: false,
        message: 'Server error'
      })
    });

    renderComponent();

    // Fill in valid form
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'User' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'ValidPass123!' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'ValidPass123!' } });

    const roleSelect = screen.getByRole('combobox');
    fireEvent.click(roleSelect);
    const adminOption = screen.getByText('Admin');
    fireEvent.click(adminOption);

    const submitButton = screen.getByRole('button', { name: /create user/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Server error');
    });
  });

  it('calls onCancel when cancel button is clicked', () => {
    renderComponent();

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('toggles password visibility', () => {
    renderComponent();

    const passwordInput = screen.getByLabelText(/^password/i);
    const toggleButton = screen.getAllByRole('button').find(btn => 
      btn.querySelector('[data-testid="eye-icon"], [data-testid="eye-off-icon"]') ||
      btn.innerHTML.includes('eye')
    );

    expect(passwordInput.type).toBe('password');

    if (toggleButton) {
      fireEvent.click(toggleButton);
      expect(passwordInput.type).toBe('text');

      fireEvent.click(toggleButton);
      expect(passwordInput.type).toBe('password');
    }
  });

  it('shows loading state during submission', async () => {
    // Mock slow API responses
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          available: true,
          message: 'Email is available'
        })
      })
      .mockImplementationOnce(
        () => new Promise(resolve => {
          setTimeout(() => resolve({
            ok: true,
            json: async () => ({
              success: true,
              user: { _id: 'test' }
            })
          }), 100);
        })
      );

    renderComponent();

    // Fill in form quickly
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'User' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'ValidPass123!' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'ValidPass123!' } });

    const roleSelect = screen.getByRole('combobox');
    fireEvent.click(roleSelect);
    const adminOption = screen.getByText('Admin');
    fireEvent.click(adminOption);

    const submitButton = screen.getByRole('button', { name: /create user/i });
    fireEvent.click(submitButton);

    // Check loading state
    await waitFor(() => {
      expect(screen.getByText('Creating User...')).toBeInTheDocument();
    });

    // Wait for completion
    await waitFor(() => {
      expect(screen.queryByText('Creating User...')).not.toBeInTheDocument();
    }, { timeout: 2000 });
  });
});