import React from 'react';
import Card from "../../components/ui/Card";

export default function AssetBasicDetails({ 
  form, 
  errors, 
  handleInputChange,
  categories,
  subcategories,
  handleCategoryChange,
  handleSubCategoryChange,
  rooms,
  locationPaths,
  isReadOnly
}) {
  const inputCls = (field) => `w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 transition-colors ${
    errors[field] ? 'border-red-400 focus:ring-red-100' : 'border-slate-300 focus:ring-teal-400'
  }`;

  return (
    <Card className="p-6 space-y-5">
      <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider border-b pb-2">Basic Identification</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Asset Name / Description</label>
          <input 
            value={form.assetDescription}
            onChange={handleInputChange('assetDescription')}
            disabled={isReadOnly}
            className={inputCls('assetDescription')}
            placeholder="e.g. Dell Latitude 3420 Laptop"
          />
          {errors.assetDescription && <p className="mt-1 text-xs text-red-500">{errors.assetDescription}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
            <select 
              value={form.categoryCode} 
              onChange={(e) => handleCategoryChange(e.target.value)}
              disabled={isReadOnly}
              className={inputCls('category')}
            >
              <option value="">Select Category</option>
              {categories.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Sub Category</label>
            <select 
              value={form.subCategoryCode} 
              onChange={(e) => handleSubCategoryChange(e.target.value)}
              disabled={isReadOnly || !form.categoryCode}
              className={inputCls('subCategory')}
            >
              <option value="">Select Sub Category</option>
              {subcategories.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Location / Room</label>
            <select 
              value={form.locationId} 
              onChange={handleInputChange('locationId')}
              disabled={isReadOnly}
              className={inputCls('locationId')}
            >
              <option value="">Select Location</option>
              {rooms.map(r => (
                <option key={r.location_id} value={r.location_id}>
                  {locationPaths[r.location_id] || r.location_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Current Condition</label>
            <select 
              value={form.status} 
              onChange={handleInputChange('status')}
              disabled={isReadOnly}
              className={inputCls('status')}
            >
              <option value="Active">Operational</option>
              <option value="Under Maintenance">Maintenance</option>
              <option value="Broken">Broken</option>
              <option value="Lost">Lost</option>
              <option value="Disposed">Disposed</option>
            </select>
          </div>
        </div>
      </div>
    </Card>
  );
}
