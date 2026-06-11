import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import {
  generateRegistrationNo,
  incrementRunningNo,
  checkRegistrationNoExists,
  insertAsset,
  insertLogHistory,
  uploadAssetImage,
  fetchSchoolCodes,
  fetchRoomLocations,
  fetchCategories,
  fetchSubcategories,
  fetchAssetTypeRefs,
  generateQrId,
  incrementQrCounter,
  generateAndSaveQR,
} from '../hooks/useAssets';

import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { 
  CheckCircleIcon, 
  ArrowLeftIcon, 
  PrinterIcon, 
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from "@heroicons/react/24/outline";

import AssetBasicDetails from "./AssetBasicDetails";
import AssetAdditionalDetails from "./AssetAdditionalDetails";
import AssetImageUpload from "./AssetImageUpload";

const SECTIONS = [
  { id: 1, label: 'Registration' },
  { id: 2, label: 'Identification' },
  { id: 3, label: 'Financial' },
  { id: 4, label: 'Placement' },
  { id: 5, label: 'Additional' },
];

const INITIAL_FORM = {
  manualRegNo: '',
  nationalCode: '',
  categoryCode: '',
  category: '',
  subCategoryCode: '',
  subCategory: '',
  brand: '',
  model: '',
  countryOfOrigin: '',
  manufacturerSerial: '',
  acquisitionPrice: '',
  assetType: '',
  acquisitionMethod: 'Purchase',
  acquisitionDate: '',
  receivedDate: '',
  officialOrderNo: '',
  warrantyPeriod: '',
  supplierName: '',
  locationId: '',
  cspHeight: '',
  placementDate: '',
  responsibleOfficer: '',
  criticalityLevel: 3,
  specifications: '',
  assetDescription: '',
};

// ── Component sub-form (shown after parent asset is saved)
function ComponentForm({ parentAsset, componentCount, onAdd }) {
  const [desc, setDesc] = useState('');
  const [serial, setSerial] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  const handleAdd = async () => {
    if (!desc.trim()) { setErr('Component description is required.'); return; }
    setSaving(true);
    setErr(null);
    const suffix = componentCount + 1;
    const compRegNo = `${parentAsset.registration_no}-${suffix}`;
    try {
      await insertAsset(supabase, {
        asset_id: compRegNo,
        registration_no: compRegNo,
        asset_name: desc,
        asset_description: desc,
        manufacturer_serial: serial || null,
        parent_asset_id: parentAsset.asset_id,
        component_suffix: suffix,
        school_id: parentAsset.school_id,
        staff_id: parentAsset.staff_id,
        status: 'Active',
        location_id: parentAsset.location_id,
        asset_type: parentAsset.asset_type,
        is_existing_asset: parentAsset.is_existing_asset,
      });
      await insertLogHistory(supabase, {
        assetId: compRegNo,
        staffId: parentAsset.staff_id,
        logDetails: `Component registered: ${desc} (${compRegNo}) under ${parentAsset.registration_no}`,
      });
      onAdd({ regNo: compRegNo, description: desc });
      setDesc('');
      setSerial('');
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 pt-4 border-t border-slate-100">
      {err && <p className="text-xs text-red-500 font-bold">Error: {err}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Component Description</label>
          <input 
            value={desc} 
            onChange={e => setDesc(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" 
            placeholder="e.g. Monitor, Keyboard, CPU" 
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Manufacturer Serial (optional)</label>
          <input 
            value={serial} 
            onChange={e => setSerial(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" 
            placeholder="e.g. SN-123456" 
          />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400 font-mono">
          Registration: <strong className="text-slate-600">{parentAsset.registration_no}-{componentCount + 1}</strong>
        </span>
        <Button onClick={handleAdd} disabled={saving} variant="primary">
          {saving ? 'Adding...' : 'Add Component'}
        </Button>
      </div>
    </div>
  );
}

// ── Main Page
export default function AssetRegistration({ user, schoolId, userRole }) {
  const [flow, setFlow] = useState('new');
  const [existingSubFlow, setExistingSubFlow] = useState('has_reg_no');
  const [form, setForm] = useState(INITIAL_FORM);
  const [activeSection, setActiveSection] = useState(1);
  const [previewRegNo, setPreviewRegNo] = useState('');
  const [schoolData, setSchoolData] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [locationPaths, setLocationPaths] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [savedAsset, setSavedAsset] = useState(null);
  const [savedQrDataUrl, setSavedQrDataUrl] = useState(null);
  const [addedComponents, setAddedComponents] = useState([]);
  const [showComponentForm, setShowComponentForm] = useState(false);

  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [assetTypeOptions, setAssetTypeOptions] = useState([]);

  const isReadOnly = userRole === 'headmaster';
  const canRegister = userRole === 'asset_teacher' || userRole === 'superadmin';
  const canOverrideType = userRole === 'headmaster' || userRole === 'superadmin';

  const handleInputChange = (field) => (e) => {
    const value = e.target?.value !== undefined ? e.target.value : e;
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleCategoryChange = (code) => {
    const cat = categories.find(c => c.code === code);
    setForm(prev => ({ ...prev, categoryCode: code, category: cat?.name || '', subCategoryCode: '', subCategory: '', nationalCode: '' }));
    setSubcategories([]);
    setAssetTypeOptions([]);
    fetchSubcategories(code).then(setSubcategories).catch(err => console.error(err));
  };

  const handleSubCategoryChange = (code) => {
    const sub = subcategories.find(s => s.code === code);
    setForm(prev => ({ ...prev, subCategoryCode: code, subCategory: sub?.name || '', nationalCode: '' }));
    setAssetTypeOptions([]);
    fetchAssetTypeRefs(code).then(setAssetTypeOptions).catch(err => console.error(err));
  };

  const handleAssetTypeChange = (code) => {
    const type = assetTypeOptions.find(t => t.code === code);
    setForm(prev => ({
      ...prev,
      nationalCode: code,
      assetDescription: prev.assetDescription || type?.name || '',
    }));
  };

  useEffect(() => {
    if (!schoolId) return;
    fetchSchoolCodes(schoolId).then(setSchoolData).catch(() => {});
    fetchRoomLocations(schoolId).then(({ rooms, paths }) => {
      setRooms(rooms);
      setLocationPaths(paths);
    }).catch(() => {});
  }, [schoolId]);

  useEffect(() => {
    fetchCategories().then(setCategories).catch(err => console.error(err));
  }, []);

  useEffect(() => {
    const price = parseFloat(form.acquisitionPrice);
    if (!isNaN(price) && form.acquisitionPrice !== '') {
      setForm(prev => ({ ...prev, assetType: price >= 2000 ? 'H' : 'R' }));
    } else if (form.acquisitionPrice === '') {
      setForm(prev => ({ ...prev, assetType: '' }));
    }
  }, [form.acquisitionPrice]);

  useEffect(() => {
    const needsGeneration = flow === 'new' || (flow === 'existing' && existingSubFlow === 'no_reg_no');
    if (!needsGeneration) {
      setPreviewRegNo(form.manualRegNo.trim().toUpperCase() || '—');
      return;
    }
    if (!schoolData || !form.assetType) { setPreviewRegNo('—'); return; }
    if (!schoolData.ptj_code || !schoolData.school_code) { setPreviewRegNo('Incomplete school profile'); return; }
    
    const year = new Date().getFullYear().toString().slice(-2);
    const runningField = form.assetType === 'H' ? 'last_running_h' : 'last_running_r';
    const nextNo = (schoolData[runningField] || 0) + 1;
    const runningNo = String(nextNo).padStart(3, '0');
    setPreviewRegNo(`KPM/${schoolData.ptj_code}/${schoolData.school_code}/${form.assetType}/${year}/${runningNo}`);
  }, [schoolData, form.assetType, flow, existingSubFlow, form.manualRegNo]);

  if (userRole === 'standard_teacher') {
    return (
      <div className="max-w-lg mx-auto mt-20 text-center p-10 bg-white rounded-2xl shadow border border-red-100">
        <h2 className="text-xl font-bold text-red-700 mb-2">Access Denied</h2>
        <p className="text-slate-500 text-sm">Asset Registration is restricted to authorized roles only.</p>
      </div>
    );
  }

  const validate = () => {
    const e = {};
    if (!form.assetDescription.trim()) e.assetDescription = 'Asset description is required.';
    if (!form.category.trim()) e.category = 'Category is required.';
    if (!form.acquisitionPrice || isNaN(parseFloat(form.acquisitionPrice))) e.acquisitionPrice = 'Valid acquisition price is required.';
    if (!form.receivedDate) e.receivedDate = 'Received date is required.';
    if (!form.locationId) e.locationId = 'Location is required.';
    if (flow === 'existing' && existingSubFlow === 'has_reg_no' && !form.manualRegNo.trim()) {
      e.manualRegNo = 'Required for existing assets.';
    }
    setErrors(e);
    return e;
  };

  const handleSave = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) return;

    setSaving(true);
    setSubmitError(null);

    try {
      let finalRegNo;
      let runningField = null;
      let currentNo = null;
      const needsGeneration = flow === 'new' || (flow === 'existing' && existingSubFlow === 'no_reg_no');

      if (needsGeneration) {
        const generated = await generateRegistrationNo(supabase, schoolId, form.assetType);
        finalRegNo = generated.regNo;
        runningField = generated.runningField;
        currentNo = generated.currentNo;
      } else {
        finalRegNo = form.manualRegNo.trim().toUpperCase();
      }

      const { qrId, newNumber: qrNewNumber } = await generateQrId(supabase, schoolId);

      let imageUrl = null;
      if (imageFile) {
        imageUrl = await uploadAssetImage(supabase, imageFile, finalRegNo.replace(/\//g, '-'));
      }

      const saved = await insertAsset(supabase, {
        asset_id: finalRegNo,
        registration_no: finalRegNo,
        asset_name: form.assetDescription,
        asset_description: form.assetDescription,
        national_code: form.nationalCode || null,
        category_code: form.categoryCode || null,
        category: form.category,
        sub_category_code: form.subCategoryCode || null,
        sub_category: form.subCategory || null,
        brand: form.brand || null,
        model: form.model || null,
        country_of_origin: form.countryOfOrigin || null,
        manufacturer_serial: form.manufacturerSerial || null,
        acquisition_price: parseFloat(form.acquisitionPrice),
        purchase_price: parseFloat(form.acquisitionPrice),
        asset_type: form.assetType,
        acquisition_method: form.acquisitionMethod,
        acquisition_date: form.acquisitionDate || null,
        received_date: form.receivedDate,
        official_order_no: form.officialOrderNo || null,
        warranty_period: form.warrantyPeriod || null,
        supplier_name: form.supplierName || null,
        location_id: parseInt(form.locationId),
        csp_height: form.cspHeight ? parseFloat(form.cspHeight) : null,
        placement_date: form.placementDate || null,
        responsible_officer: form.responsibleOfficer || null,
        criticality_level: form.criticalityLevel,
        specifications: form.specifications || null,
        image_url: imageUrl,
        qr_code_id: null,
        is_existing_asset: flow === 'existing',
        school_id: schoolId,
        staff_id: user.id,
        status: 'Active',
      });

      let generatedQrDataUrl = null;
      try {
        const qrResult = await generateAndSaveQR(supabase, saved.asset_id, qrId);
        generatedQrDataUrl = qrResult.qrDataUrl;
      } catch (qrErr) {
        console.error('QR generation failed:', qrErr.message);
      }

      if (generatedQrDataUrl) await incrementQrCounter(supabase, schoolId, qrNewNumber);
      if (runningField && currentNo) {
        await incrementRunningNo(supabase, schoolId, runningField, currentNo);
        setSchoolData(prev => ({ ...prev, [runningField]: currentNo }));
      }

      await insertLogHistory(supabase, {
        assetId: finalRegNo,
        staffId: user.id,
        logDetails: `Asset registered: ${form.assetDescription}`,
      });

      setSavedQrDataUrl(generatedQrDataUrl);
      setSavedAsset({ ...saved, qr_code_id: generatedQrDataUrl ? qrId : null });
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setForm(INITIAL_FORM);
    setFlow('new');
    setSavedAsset(null);
    setImagePreview(null);
    setImageFile(null);
    setAddedComponents([]);
    setShowComponentForm(false);
    setActiveSection(1);
    setErrors({});
  };

  const handlePrintQR = () => {
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>QR Label — ${savedAsset.qr_code_id}</title>
      <style>body { font-family: monospace; text-align: center; padding: 40px; } img { width: 300px; height: 300px; } </style></head><body>
      <img src="${savedQrDataUrl}" /><div style="font-size:20px; font-weight:bold">${savedAsset.qr_code_id}</div>
      <div>${savedAsset.registration_no}</div><div>${savedAsset.asset_name}</div>
      <script>window.onload = () => { window.print(); }</script></body></html>
    `);
    win.document.close();
  };

  if (savedAsset) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 pb-10">
        <Card className="p-8 text-center border-green-200">
          <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800">Asset Registered Successfully</h2>
          <p className="text-slate-500 mb-6">{savedAsset.asset_name}</p>
          
          {savedQrDataUrl && (
            <div className="flex flex-col items-center gap-2 mb-6">
              <img src={savedQrDataUrl} alt="QR Code" className="w-48 h-48 border-2 border-slate-100 rounded-xl" />
              <p className="font-mono font-bold text-teal-700 tracking-widest">{savedAsset.qr_code_id}</p>
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-4">
            <Button onClick={handlePrintQR} variant="secondary">
              <PrinterIcon className="w-5 h-5 mr-2" />
              Print Label
            </Button>
            <Button onClick={handleReset} variant="primary">
              <PlusIcon className="w-5 h-5 mr-2" />
              Register Another
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800">Accessories & Components</h3>
            {!showComponentForm && (
              <Button onClick={() => setShowComponentForm(true)} variant="primary">
                Add Component
              </Button>
            )}
          </div>
          {addedComponents.length > 0 && (
            <ul className="divide-y divide-slate-100 mb-4">
              {addedComponents.map((c, i) => (
                <li key={i} className="py-3 flex justify-between text-sm">
                  <span className="font-medium text-slate-700">{c.description}</span>
                  <span className="font-mono text-teal-700 font-bold">{c.regNo}</span>
                </li>
              ))}
            </ul>
          )}
          {showComponentForm && (
            <ComponentForm
              parentAsset={savedAsset}
              componentCount={addedComponents.length}
              onAdd={c => { setAddedComponents(prev => [...prev, c]); setShowComponentForm(false); }}
            />
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-28">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Asset Registration</h1>
        <p className="text-slate-500 font-medium">Add physical assets under KEW.PA-3 or KEW.PA-4 standards.</p>
      </div>

      <div className="bg-white rounded-xl shadow border border-slate-200 p-5 mb-6">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Asset Entry Type</p>
        <div className="flex gap-2 p-1 bg-slate-100 rounded-lg w-fit">
          {['new', 'existing'].map(f => (
            <button 
              key={f} 
              onClick={() => !isReadOnly && setFlow(f)}
              className={`px-6 py-2 rounded-md font-bold text-sm transition-colors ${flow === f ? 'bg-white shadow text-teal-700' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {f === 'new' ? 'New Asset' : 'Existing Asset'}
            </button>
          ))}
        </div>
        
        {flow === 'existing' && (
          <div className="mt-4 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="radio" checked={existingSubFlow === 'has_reg_no'} onChange={() => setExistingSubFlow('has_reg_no')} className="accent-teal-600" />
              <span className="text-sm font-semibold text-slate-700">Manual Entry</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="radio" checked={existingSubFlow === 'no_reg_no'} onChange={() => setExistingSubFlow('no_reg_no')} className="accent-teal-600" />
              <span className="text-sm font-semibold text-slate-700">Auto Generate</span>
            </label>
            {existingSubFlow === 'has_reg_no' && (
              <div className="max-w-sm pt-2">
                <input 
                  value={form.manualRegNo} 
                  onChange={handleInputChange('manualRegNo')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono text-sm focus:ring-2 focus:ring-teal-400 outline-none" 
                  placeholder="KPM/JPNS/SKRP/H/25/001" 
                />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 bg-teal-50 border-2 border-teal-300 rounded-xl p-4 mb-6">
        <div className="flex-1">
          <p className="text-xs font-bold text-teal-600 uppercase tracking-wider mb-0.5">Registration No Preview</p>
          <p className="font-mono font-bold text-lg text-teal-900 tracking-widest">{previewRegNo}</p>
        </div>
        {form.assetType && (
          <Badge variant="brand">
            {form.assetType === 'H' ? 'KEW.PA-3' : 'KEW.PA-4'}
          </Badge>
        )}
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {SECTIONS.map(s => (
          <button 
            key={s.id} 
            onClick={() => setActiveSection(s.id)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap ${activeSection === s.id ? 'bg-teal-600 text-white shadow' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {activeSection <= 2 && (
            <AssetBasicDetails 
              form={form} 
              errors={errors} 
              handleInputChange={handleInputChange}
              categories={categories}
              subcategories={subcategories}
              handleCategoryChange={handleCategoryChange}
              handleSubCategoryChange={handleSubCategoryChange}
              rooms={rooms}
              locationPaths={locationPaths}
              isReadOnly={isReadOnly}
            />
          )}
          
          {activeSection >= 3 && (
            <AssetAdditionalDetails 
              form={form} 
              errors={errors} 
              handleInputChange={handleInputChange}
              isReadOnly={isReadOnly}
            />
          )}
        </div>

        <div className="lg:col-span-1">
          <AssetImageUpload 
            imagePreview={imagePreview} 
            setImagePreview={setImagePreview} 
            setImageFile={setImageFile}
            isReadOnly={isReadOnly}
          />
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <Button 
          variant="secondary" 
          onClick={() => setActiveSection(s => Math.max(1, s - 1))} 
          disabled={activeSection === 1}
        >
          <ChevronLeftIcon className="w-4 h-4 mr-1" />
          Previous
        </Button>
        <Button 
          variant="secondary" 
          onClick={() => setActiveSection(s => Math.min(5, s + 1))} 
          disabled={activeSection === 5}
        >
          Next
          <ChevronRightIcon className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {canRegister && (
        <div className="fixed bottom-0 left-0 md:left-72 right-0 bg-white border-t border-slate-200 p-4 z-40 shadow-lg">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="text-sm">
              {submitError ? <span className="text-red-600 font-bold">Error: {submitError}</span> : <span className="text-slate-500 font-medium">Ready to register asset</span>}
            </div>
            <div className="flex gap-3">
              <Button onClick={() => window.history.back()} variant="secondary">Cancel</Button>
              <Button onClick={handleSave} disabled={saving} variant="primary">
                {saving ? "Registering..." : "Register Asset"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
