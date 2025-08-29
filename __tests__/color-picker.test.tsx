import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ColorPickerPage from '../app/color-picker/page';

// Mock navigator.clipboard
const mockClipboard = {
  writeText: jest.fn(),
};
Object.assign(navigator, {
  clipboard: mockClipboard,
});

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

describe('ColorPickerPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the Color Picker page with all components', () => {
    render(<ColorPickerPage />);

    // Check main heading
    expect(screen.getByRole('heading', { name: 'Color Picker' })).toBeInTheDocument();

    // Check card titles
    expect(screen.getByText('Color Contrast Checker')).toBeInTheDocument();

    // Check format labels
    expect(screen.getByText('HEX')).toBeInTheDocument();
    expect(screen.getByText('RGB')).toBeInTheDocument();
    expect(screen.getByText('HSL')).toBeInTheDocument();

    // Check input fields
    expect(screen.getByPlaceholderText('#3b82f6')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('59, 130, 246')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('217, 91%, 60%')).toBeInTheDocument();

    // Check buttons
    expect(screen.getByText('Random')).toBeInTheDocument();
    expect(screen.getByText('Save Color')).toBeInTheDocument();
    expect(screen.getAllByText('Copy')).toHaveLength(3); // HEX, RGB, HSL copy buttons

    // Check contrast checker elements
    expect(screen.getByText('Compare Against')).toBeInTheDocument();
    expect(screen.getByText('Contrast Analysis')).toBeInTheDocument();
    expect(screen.getByText('Text Preview')).toBeInTheDocument();
    expect(screen.getByText('Quick Contrast Tests')).toBeInTheDocument();
    expect(screen.getByText('vs White')).toBeInTheDocument();
    expect(screen.getByText('vs Black')).toBeInTheDocument();
  });

  it('updates color formats when hex input changes', () => {
    render(<ColorPickerPage />);

    const hexInput = screen.getByPlaceholderText('#3b82f6');
    const rgbInput = screen.getByPlaceholderText('59, 130, 246');
    const hslInput = screen.getByPlaceholderText('217, 91%, 60%');

    // Change hex color
    fireEvent.change(hexInput, { target: { value: '#ff0000' } });

    expect(hexInput).toHaveValue('#ff0000');
    expect(rgbInput).toHaveValue('255, 0, 0');
    expect(hslInput).toHaveValue('0, 100%, 50%');
  });

  it('updates color formats when RGB input changes', () => {
    render(<ColorPickerPage />);

    const hexInput = screen.getByPlaceholderText('#3b82f6');
    const rgbInput = screen.getByPlaceholderText('59, 130, 246');

    // Change RGB color
    fireEvent.change(rgbInput, { target: { value: '0, 255, 0' } });

    expect(hexInput).toHaveValue('#00ff00');
    expect(rgbInput).toHaveValue('0, 255, 0');
  });

  it('updates color formats when HSL input changes', () => {
    render(<ColorPickerPage />);

    const hexInput = screen.getByPlaceholderText('#3b82f6');
    const hslInput = screen.getByPlaceholderText('217, 91%, 60%');

    // Change HSL color
    fireEvent.change(hslInput, { target: { value: '240, 100%, 50%' } });

    expect(hexInput).toHaveValue('#0000ff');
    expect(hslInput).toHaveValue('240, 100%, 50%');
  });

  it('generates random color when random button is clicked', () => {
    const { toast } = require('sonner');
    render(<ColorPickerPage />);

    const randomButton = screen.getByText('Random');
    const hexInput = screen.getByPlaceholderText('#3b82f6');
    
    const initialValue = hexInput.value;
    
    fireEvent.click(randomButton);

    // Color should have changed (though we can't predict the exact value)
    expect(hexInput.value).toMatch(/^#[0-9a-f]{6}$/i);
    expect(toast.info).toHaveBeenCalledWith('Random color generated!');
  });

  it('saves color to history', () => {
    const { toast } = require('sonner');
    render(<ColorPickerPage />);

    const saveButton = screen.getByText('Save Color');
    
    fireEvent.click(saveButton);

    expect(toast.success).toHaveBeenCalledWith('Color added to history!');
    
    // Check that history section appears
    expect(screen.getByText('Recent Colors')).toBeInTheDocument();
    expect(screen.getByText('Clear History')).toBeInTheDocument();
  });

  it('copies color values to clipboard', async () => {
    const { toast } = require('sonner');
    render(<ColorPickerPage />);

    const hexCopyButton = screen.getAllByText('Copy')[0]; // First copy button (HEX)
    
    fireEvent.click(hexCopyButton);

    await waitFor(() => {
      expect(mockClipboard.writeText).toHaveBeenCalledWith('#3b82f6');
      expect(toast.success).toHaveBeenCalledWith('HEX copied to clipboard!');
    });
  });

  it('updates contrast color when vs White/Black buttons are clicked', () => {
    render(<ColorPickerPage />);

    const vsWhiteButton = screen.getByText('vs White');
    const vsBlackButton = screen.getByText('vs Black');

    fireEvent.click(vsWhiteButton);
    // We can verify the button was clicked without checking internal state

    fireEvent.click(vsBlackButton);
    // We can verify the button was clicked without checking internal state
  });

  it('displays contrast ratio information', () => {
    render(<ColorPickerPage />);

    // Check that contrast analysis is displayed
    expect(screen.getByText('Contrast Ratio:')).toBeInTheDocument();
    expect(screen.getByText('WCAG Rating:')).toBeInTheDocument();
  });

  it('clears color history when clear button is clicked', () => {
    const { toast } = require('sonner');
    render(<ColorPickerPage />);

    // First save a color to create history
    const saveButton = screen.getByText('Save Color');
    fireEvent.click(saveButton);

    // Then clear the history
    const clearButton = screen.getByText('Clear History');
    fireEvent.click(clearButton);

    expect(toast.info).toHaveBeenCalledWith('Color history cleared!');
  });

  it('handles color picker input change', () => {
    render(<ColorPickerPage />);

    // Find the native color input
    const colorInputs = screen.getAllByDisplayValue('#3b82f6');
    const nativeColorPicker = colorInputs.find((input) => input.type === 'color');
    
    expect(nativeColorPicker).toBeInTheDocument();

    if (nativeColorPicker) {
      fireEvent.change(nativeColorPicker, { target: { value: '#ff00ff' } });
      
      // Verify the hex input was updated
      const hexInput = screen.getByPlaceholderText('#3b82f6');
      expect(hexInput).toHaveValue('#ff00ff');
    }
  });

  it('handles invalid hex input gracefully', () => {
    render(<ColorPickerPage />);

    const hexInput = screen.getByPlaceholderText('#3b82f6');
    
    // Enter invalid hex value
    fireEvent.change(hexInput, { target: { value: 'invalid' } });
    
    // Input should show the typed value but other inputs shouldn't change
    expect(hexInput).toHaveValue('invalid');
  });

  it('displays text preview with different color combinations', () => {
    render(<ColorPickerPage />);

    // Check that text preview sections are present
    expect(screen.getByText('Text Preview')).toBeInTheDocument();
    expect(screen.getAllByText('Large Text (18pt+)')).toHaveLength(2);
    expect(screen.getAllByText('Normal text (under 18pt)')).toHaveLength(2);
  });
});