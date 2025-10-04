import React, { useState, useEffect } from 'react';
import { PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface InlineEditProps {
  rowData: any;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (updatedData: any) => void;
  onCancel: () => void;
  editableFields: string[];
  fieldLabels: Record<string, string>;
  fieldTypes?: Record<string, 'text' | 'select' | 'textarea'>;
  selectOptions?: Record<string, { value: string; label: string }[]>;
}

const InlineEdit: React.FC<InlineEditProps> = ({
  rowData,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  editableFields,
  fieldLabels,
  fieldTypes = {},
  selectOptions = {}
}) => {
  const [editData, setEditData] = useState<any>({});

  // Initialize edit data when entering edit mode
  useEffect(() => {
    if (isEditing) {
      setEditData({ ...rowData });
    }
  }, [isEditing, rowData]);

  const handleFieldChange = (field: string, value: string) => {
    setEditData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    onSave(editData);
  };

  const handleCancel = () => {
    setEditData({});
    onCancel();
  };

  const renderField = (field: string) => {
    const fieldType = fieldTypes[field] || 'text';
    const value = editData[field] || '';

    switch (fieldType) {
      case 'select':
        const options = selectOptions[field] || [];
        return (
          <select
            value={value}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            rows={2}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        );
      
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        );
    }
  };

  if (!isEditing) {
    return (
      <button
        onClick={onEdit}
        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
        title="Quick Edit"
      >
        <PencilIcon className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className="flex space-x-1">
      <button
        onClick={handleSave}
        className="p-1 text-gray-400 hover:text-green-600 transition-colors"
        title="Save Changes"
      >
        <CheckIcon className="w-4 h-4" />
      </button>
      <button
        onClick={handleCancel}
        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
        title="Cancel Changes"
      >
        <XMarkIcon className="w-4 h-4" />
      </button>
    </div>
  );
};

export default InlineEdit;

// Standalone inline edit cell component for individual cell editing
interface StandaloneInlineEditProps {
  value: string;
  onSave: (value: string) => Promise<boolean> | boolean;
  type?: 'text' | 'select' | 'textarea';
  options?: { value: string; label: string }[];
}

export const StandaloneInlineEdit: React.FC<StandaloneInlineEditProps> = React.memo(({
  value,
  onSave,
  type = 'text',
  options = []
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      const success = await onSave(editValue);
      if (success) {
        setIsEditing(false);
      } else {
        // Reset to original value if save failed
        setEditValue(value);
      }
    } catch (error) {
      console.error('Error saving:', error);
      setEditValue(value);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && type !== 'textarea') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  // Update edit value when prop value changes
  useEffect(() => {
    setEditValue(value);
  }, [value]);

  if (!isEditing) {
    return (
      <div className="group flex items-center justify-center">
        <span className="text-sm text-gray-900">{value || '-'}</span>
        <button
          onClick={() => setIsEditing(true)}
          className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        >
          <PencilIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-1">
      {type === 'select' ? (
        <select
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          autoFocus
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          autoFocus
        />
      ) : (
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          autoFocus
        />
      )}
      
      <button
        onClick={handleSave}
        disabled={isSaving}
        className="p-1 text-green-600 hover:text-green-800 disabled:opacity-50"
      >
        <CheckIcon className="h-4 w-4" />
      </button>
      
      <button
        onClick={handleCancel}
        disabled={isSaving}
        className="p-1 text-red-600 hover:text-red-800 disabled:opacity-50"
      >
        <XMarkIcon className="h-4 w-4" />
      </button>
    </div>
  );
});

// Inline editable cell component
interface InlineEditCellProps {
  value: string;
  isEditing: boolean;
  field: string;
  onFieldChange: (field: string, value: string) => void;
  fieldType?: 'text' | 'select' | 'textarea';
  selectOptions?: { value: string; label: string }[];
}

export const InlineEditCell: React.FC<InlineEditCellProps> = ({
  value,
  isEditing,
  field,
  onFieldChange,
  fieldType = 'text',
  selectOptions = []
}) => {
  if (!isEditing) {
    return (
      <span className="text-sm text-gray-900">{value || '-'}</span>
    );
  }

  switch (fieldType) {
    case 'select':
      return (
        <select
          value={value}
          onChange={(e) => onFieldChange(field, e.target.value)}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {selectOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    
    case 'textarea':
      return (
        <textarea
          value={value}
          onChange={(e) => onFieldChange(field, e.target.value)}
          rows={1}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      );
    
    default:
      return (
        <input
          type="text"
          value={value}
          onChange={(e) => onFieldChange(field, e.target.value)}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      );
  }
};