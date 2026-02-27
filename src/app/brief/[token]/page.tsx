'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { Brief, BrandProfile, Lang, WizardField, WizardStepDef } from '@/lib/types'
import { t } from '@/lib/i18n'
import { wizardSteps, getStepsForScope, scopeOptions, ProjectScope } from '@/lib/wizard-steps'
import Button from '@/components/ui/Button'
import Card, { CardContent } from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import LanguageToggle from '@/components/LanguageToggle'
import ThemeToggle, { Theme } from '@/components/ThemeToggle'
import { Loader2, CheckCircle, Clock, Save, ChevronRight, ChevronLeft, ArrowRight, X } from 'lucide-react'

type PageStatus = 'loading' | 'welcome' | 'scope' | 'wizard' | 'success' | 'expired' | 'not-found'

// ============================================
// Slider Component — with theme support
// ============================================
function SliderField({
  field,
  value,
  onChange,
  lang,
  accentColor,
  dark,
}: {
  field: WizardField
  value: number
  onChange: (val: number) => void
  lang: Lang
  accentColor?: string
  dark: boolean
}) {
  const min = field.validation?.min ?? 0
  const max = field.validation?.max ?? 10
  const currentVal = typeof value === 'number' ? value : 5
  const percentage = ((currentVal - min) / (max - min)) * 100

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className={`text-sm font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>
          {lang === 'pl' ? field.label.pl : field.label.en}
        </label>
        <span
          className="text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{
            backgroundColor: dark
              ? (accentColor ? `${accentColor}20` : 'rgba(212,255,0,0.12)')
              : (accentColor ? `${accentColor}18` : 'rgba(100,120,0,0.1)'),
            color: dark ? (accentColor || '#D4FF00') : (accentColor || '#4a5500'),
          }}
        >
          {currentVal}/{max}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={currentVal}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="w-full h-1 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, ${accentColor || (dark ? '#D4FF00' : '#4a5500')} ${percentage}%, ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} ${percentage}%)`,
        }}
      />
      <div className={`flex justify-between text-[10px] ${dark ? 'text-r-white-dim' : 'text-gray-400'}`}>
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  )
}

// ============================================
// Section Header
// ============================================
function SectionHeader({
  field,
  lang,
  accentColor,
  dark,
}: {
  field: WizardField
  lang: Lang
  accentColor?: string
  dark: boolean
}) {
  return (
    <div className="pt-8 pb-3">
      <h3
        className="text-base font-semibold"
        style={{ color: accentColor || (dark ? '#D4FF00' : '#4a5500') }}
      >
        {lang === 'pl' ? field.label.pl : field.label.en}
      </h3>
      <div className={`mt-2 h-px ${dark ? 'bg-md-outline-variant' : 'bg-gray-200'}`} />
    </div>
  )
}

// ============================================
// Main Page Component
// ============================================
export default function PublicBriefPage() {
  const params = useParams()
  const token = params.token as string

  const [status, setStatus] = useState<PageStatus>('loading')
  const [brief, setBrief] = useState<Brief | null>(null)
  const [brand, setBrand] = useState<BrandProfile | null>(null)
  const [lang, setLang] = useState<Lang>('pl')
  const [theme, setTheme] = useState<Theme>('dark')
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const [selectedScope, setSelectedScope] = useState<ProjectScope | null>(null)

  // All wizard data across all steps
  const [allData, setAllData] = useState<Record<string, any>>({})
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [saveError, setSaveError] = useState<string | null>(null)

  // Auto-save timer (debounced backup — saves every 3s when data changes)
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const dataChangedRef = useRef(false)

  // Shorthand for dark mode
  const d = theme === 'dark'

  // Steps filtered by selected scope
  const activeSteps = useMemo(() => {
    if (!selectedScope) return wizardSteps
    return getStepsForScope(selectedScope)
  }, [selectedScope])

  // ---- Load brief ----
  useEffect(() => {
    const loadBrief = async () => {
      // Demo mode — no API needed
      if (token === 'demo') {
        const demoBrief: Brief = {
          id: 'demo',
          agent_id: 'demo',
          brand_profile_id: null,
          client_name: 'Demo User',
          client_email: null,
          client_company: 'Acme Corp',
          title: 'Demo Brief',
          status: 'in_progress',
          lang: 'en',
          scope: null,
          public_token: 'demo',
          token_expires_at: null,
          wizard_data: {},
          sent_at: null,
          started_at: null,
          completed_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        setBrief(demoBrief)
        setLang('en')
        setStatus('welcome')
        return
      }

      try {
        const response = await fetch(`/api/public/brief/${token}`)

        if (response.status === 404) { setStatus('not-found'); return }
        if (response.status === 410) { setStatus('expired'); return }
        if (!response.ok) { setStatus('not-found'); return }

        const briefData = await response.json()

        // Load brand profile for completed briefs too
        if (briefData.brand_profile) {
          setBrand(briefData.brand_profile)
        }

        if (briefData.status === 'completed') {
          setBrief(briefData)
          // Load existing data so edit mode can restore them
          if (briefData.wizard_data && typeof briefData.wizard_data === 'object') {
            setAllData(briefData.wizard_data)
            if (briefData.wizard_data._scope) {
              setSelectedScope(briefData.wizard_data._scope)
            }
          }
          setStatus('success')
          return
        }

        if (briefData.wizard_data && typeof briefData.wizard_data === 'object') {
          setAllData(briefData.wizard_data)
          // Restore scope if already selected
          if (briefData.wizard_data._scope) {
            setSelectedScope(briefData.wizard_data._scope)
          }
        }

        // Brand profile is now included in the brief response
        if (briefData.brand_profile) {
          setBrand(briefData.brand_profile)
        }

        setBrief(briefData)
        setLang(briefData.lang || 'pl')
        setStatus('welcome')
      } catch (err) {
        console.error('Error loading brief:', err)
        setStatus('not-found')
      }
    }
    loadBrief()
  }, [token])

  // ---- Save step data (called on Next/Submit only) ----
  const saveStepData = useCallback(
    async (data: Record<string, any>, stepNum: number, isFinal: boolean = false): Promise<boolean> => {
      if (!brief) return false
      // Skip API calls in demo mode
      if (token === 'demo') {
        setLastSaved(
          new Date().toLocaleTimeString(lang === 'pl' ? 'pl-PL' : 'en-US', {
            hour: '2-digit',
            minute: '2-digit',
          })
        )
        return true
      }
      setIsSaving(true)
      try {
        const step = activeSteps[stepNum]
        if (!step) { setIsSaving(false); return false }

        console.log(`[Brief Save] Step ${stepNum} (${step.key}), isFinal=${isFinal}, keys:`, Object.keys(data).length)

        const payload: Record<string, any> = {
          step_number: stepNum,
          step_key: step.key,
          step_data: data,
        }
        if (isFinal) {
          payload.is_final = true
        }

        const response = await fetch(`/api/public/brief/${token}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (response.ok) {
          console.log(`[Brief Save] Success - step ${stepNum}`)
          setLastSaved(
            new Date().toLocaleTimeString(lang === 'pl' ? 'pl-PL' : 'en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })
          )
          return true
        } else {
          const errData = await response.json().catch(() => ({}))
          console.error(`[Brief Save] Error - step ${stepNum}:`, response.status, errData)
          return false
        }
      } catch (err) {
        console.error('[Brief Save] Network error:', err)
        return false
      } finally {
        setIsSaving(false)
      }
    },
    [brief, token, lang, activeSteps]
  )

  // ---- Auto-save effect (debounced backup, every 3s) ----
  useEffect(() => {
    // Only auto-save when in wizard mode and data has changed
    if (status !== 'wizard' || token === 'demo' || !brief) return
    if (!dataChangedRef.current) return

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)

    saveTimerRef.current = setTimeout(async () => {
      const step = activeSteps[currentStep]
      if (!step) return

      console.log('[Auto-Save] Triggering for step', currentStep, step.key)
      const saved = await saveStepData(allData, currentStep, false)
      if (saved) {
        dataChangedRef.current = false
        setSaveError(null)
        console.log('[Auto-Save] Success')
      } else {
        setSaveError(lang === 'pl' ? 'Zapis nie powiódł się' : 'Save failed')
        console.error('[Auto-Save] Failed')
      }
    }, 3000)

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [allData, status, brief, token, currentStep, activeSteps, saveStepData, lang])

  // ---- Save on page unload (best-effort) ----
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (status !== 'wizard' || token === 'demo' || !brief || !dataChangedRef.current) return
      const step = activeSteps[currentStep]
      if (!step) return

      // Use sendBeacon for best-effort save on page close
      const payload = JSON.stringify({
        step_number: currentStep,
        step_key: step.key,
        step_data: allData,
      })
      navigator.sendBeacon(`/api/public/brief/${token}`, new Blob([payload], { type: 'application/json' }))
      console.log('[Beacon Save] Sent on page unload')
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [status, token, brief, currentStep, activeSteps, allData])

  // ---- Handlers ----
  // Field change updates local state AND marks data as changed for auto-save
  const handleFieldChange = (fieldKey: string, value: any) => {
    if (validationErrors.length > 0) setValidationErrors([])
    setSaveError(null)
    dataChangedRef.current = true
    setAllData((prev) => ({ ...prev, [fieldKey]: value }))
  }

  const handleSelectScope = (scope: ProjectScope) => {
    setSelectedScope(scope)
    dataChangedRef.current = true
    setAllData((prev) => ({ ...prev, _scope: scope, brief_type: scope }))
  }

  const handleStartWizard = () => {
    setStatus('scope')
  }

  const handleScopeConfirm = async () => {
    if (!selectedScope) return
    // Save scope immediately when confirmed
    const scopeData = { ...allData, _scope: selectedScope, brief_type: selectedScope }
    if (token !== 'demo' && brief) {
      const steps = getStepsForScope(selectedScope)
      if (steps.length > 0) {
        console.log('[Brief Save] Saving scope selection:', selectedScope)
        try {
          const response = await fetch(`/api/public/brief/${token}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              step_number: 0,
              step_key: steps[0].key,
              step_data: scopeData,
            }),
          })
          if (response.ok) {
            console.log('[Brief Save] Scope saved successfully')
            dataChangedRef.current = false
          } else {
            console.error('[Brief Save] Scope save failed:', response.status)
          }
        } catch (err) {
          console.error('[Brief Save] Scope save error:', err)
        }
      }
    }
    setCurrentStep(0)
    setStatus('wizard')
  }

  const handleNextStep = async () => {
    // Validate required fields
    const step = activeSteps[currentStep]
    if (step) {
      const missing = step.fields
        .filter((f) => f.required && f.type !== 'section_header')
        .filter((f) => {
          const val = allData[f.key]
          if (Array.isArray(val)) return val.length === 0
          return val === undefined || val === null || val === ''
        })
        .map((f) => lang === 'pl' ? f.label.pl : f.label.en)

      if (missing.length > 0) {
        setValidationErrors(missing)
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }
    }
    setValidationErrors([])

    // Save current step data
    const isLastStep = currentStep >= activeSteps.length - 1
    const saved = await saveStepData(allData, currentStep, isLastStep)

    if (!saved) {
      setSaveError(lang === 'pl'
        ? 'Nie udało się zapisać. Sprawdź połączenie.'
        : 'Failed to save. Check your connection.')
      alert(lang === 'pl'
        ? 'Nie udało się zapisać danych. Sprawdź połączenie i spróbuj ponownie.'
        : 'Failed to save data. Check your connection and try again.')
      return
    }

    // Explicit save succeeded — reset auto-save flag
    dataChangedRef.current = false
    setSaveError(null)

    if (isLastStep) {
      // Final submission — mark as completed
      setBrief((prev) => (prev ? { ...prev, status: 'completed' } : null))
      setStatus('success')
    } else {
      setCurrentStep(currentStep + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handlePreviousStep = async () => {
    // Save before going back (non-blocking — don't stop navigation on failure)
    saveStepData(allData, currentStep)
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // ---- Colors ----
  const accentColor = brand?.accent_color || (d ? '#D4FF00' : '#4a5500')
  const accentColorBtn = brand?.accent_color || '#D4FF00'

  // ---- Theme-aware class helpers ----
  const cls = {
    bg: d ? 'bg-r-bg' : 'bg-gray-50',
    bgCard: d ? 'bg-r-bg-card' : 'bg-white',
    bgInput: d ? 'bg-r-bg-input' : 'bg-gray-50',
    bgElevated: d ? 'bg-r-bg-elevated' : 'bg-gray-100',
    text: d ? 'text-white' : 'text-gray-900',
    textDim: d ? 'text-r-white-dim' : 'text-gray-500',
    textMuted: d ? 'text-r-white-muted' : 'text-gray-400',
    border: d ? 'border-r-border' : 'border-gray-200',
    borderStrong: d ? 'border-r-border-strong' : 'border-gray-300',
    inputCls: d
      ? 'bg-r-bg-input text-white placeholder-r-white-muted border-r-border-strong focus:ring-r-lime/30 focus:border-r-lime'
      : 'bg-gray-50 text-gray-900 placeholder-gray-400 border-gray-300 focus:ring-emerald-500/30 focus:border-emerald-500',
    cardShadow: d ? 'shadow-md-1 border-r-border' : 'shadow-sm border-gray-200',
  }

  // ---- Render field ----
  const renderField = (field: WizardField) => {
    const value = allData[field.key] ?? ''
    const fieldLabel = lang === 'pl' ? field.label.pl : field.label.en
    const fieldPlaceholder = field.placeholder
      ? lang === 'pl' ? field.placeholder.pl : field.placeholder.en
      : ''
    const fieldHelpText = field.helpText
      ? lang === 'pl' ? field.helpText.pl : field.helpText.en
      : ''

    if (field.type === 'section_header') {
      return <SectionHeader key={field.key} field={field} lang={lang} accentColor={accentColor} dark={d} />
    }

    if (field.type === 'slider') {
      return (
        <SliderField
          key={field.key}
          field={field}
          value={typeof value === 'number' ? value : 5}
          onChange={(val) => handleFieldChange(field.key, val)}
          lang={lang}
          accentColor={accentColor}
          dark={d}
        />
      )
    }

    if (field.type === 'text' || field.type === 'url') {
      return (
        <div key={field.key} className="space-y-1">
          <label className={`block text-sm font-medium ${cls.text} mb-2`}>
            {fieldLabel}
            {field.required && <span className="text-r-error"> *</span>}
            {!field.required && (
              <span className={`${cls.textDim} font-normal text-xs ml-1`}>
                ({t('wizard.optional', lang)})
              </span>
            )}
          </label>
          <input
            type={field.type === 'url' ? 'url' : 'text'}
            value={value}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            placeholder={fieldPlaceholder || (field.type === 'url' ? 'https://...' : '')}
            required={field.required}
            className={`w-full px-4 py-3 rounded-md-sm border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 text-sm ${cls.inputCls}`}
          />
          {fieldHelpText && <p className={`text-xs ${cls.textDim} ml-1`}>{fieldHelpText}</p>}
        </div>
      )
    }

    if (field.type === 'textarea') {
      return (
        <div key={field.key} className="space-y-1">
          <label className={`block text-sm font-medium ${cls.text} mb-2`}>
            {fieldLabel}
            {field.required && <span className="text-r-error"> *</span>}
            {!field.required && (
              <span className={`${cls.textDim} font-normal text-xs ml-1`}>
                ({t('wizard.optional', lang)})
              </span>
            )}
          </label>
          <textarea
            value={value}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            placeholder={fieldPlaceholder}
            className={`w-full px-4 py-3 rounded-md-sm border transition-all resize-y text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 ${cls.inputCls}`}
            rows={3}
            required={field.required}
          />
          {fieldHelpText && <p className={`text-xs ${cls.textDim}`}>{fieldHelpText}</p>}
        </div>
      )
    }

    if (field.type === 'select') {
      return (
        <div key={field.key} className="space-y-1">
          <label className={`block text-sm font-medium ${cls.text} mb-2`}>
            {fieldLabel}
            {field.required && <span className="text-r-error"> *</span>}
            {!field.required && (
              <span className={`${cls.textDim} font-normal text-xs ml-1`}>
                ({t('wizard.optional', lang)})
              </span>
            )}
          </label>
          <div className="relative">
            <select
              value={value}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              required={field.required}
              className={`w-full px-4 py-3 rounded-md-sm border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 appearance-none pr-10 text-sm ${cls.inputCls}`}
            >
              <option value="">--</option>
              {field.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {lang === 'pl' ? opt.label.pl : opt.label.en}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <svg className={`h-5 w-5 ${cls.textMuted}`} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      )
    }

    if (field.type === 'date') {
      return (
        <div key={field.key} className="space-y-1">
          <label className={`block text-sm font-medium ${cls.text} mb-2`}>
            {fieldLabel}
            {field.required && <span className="text-r-error"> *</span>}
            {!field.required && (
              <span className={`${cls.textDim} font-normal text-xs ml-1`}>
                ({t('wizard.optional', lang)})
              </span>
            )}
          </label>
          <input
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            required={field.required}
            className={`w-full px-4 py-3 rounded-md-sm border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 text-sm ${cls.inputCls}`}
          />
        </div>
      )
    }

    if (field.type === 'number') {
      return (
        <div key={field.key} className="space-y-1">
          <label className={`block text-sm font-medium ${cls.text} mb-2`}>
            {fieldLabel}
            {field.required && <span className="text-r-error"> *</span>}
            {!field.required && (
              <span className={`${cls.textDim} font-normal text-xs ml-1`}>
                ({t('wizard.optional', lang)})
              </span>
            )}
          </label>
          <input
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            placeholder={fieldPlaceholder}
            required={field.required}
            className={`w-full px-4 py-3 rounded-md-sm border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 text-sm ${cls.inputCls}`}
          />
        </div>
      )
    }

    if (field.type === 'radio') {
      return (
        <div key={field.key} className="space-y-3">
          <label className={`block text-sm font-medium ${cls.text}`}>
            {fieldLabel}
            {field.required && <span className="text-r-error"> *</span>}
          </label>
          <div className="space-y-2">
            {field.options?.map((opt) => (
              <label
                key={opt.value}
                className={`flex items-center gap-3 cursor-pointer p-3 rounded-md-sm border transition-all duration-200 ${
                  value === opt.value
                    ? 'border-transparent'
                    : d
                      ? 'border-r-border-strong hover:border-r-white-muted bg-r-bg-card'
                      : 'border-gray-200 hover:border-gray-400 bg-white'
                }`}
                style={
                  value === opt.value
                    ? {
                        backgroundColor: d ? `${accentColor}08` : `${accentColor}0a`,
                        boxShadow: `0 0 0 2px ${accentColor}`,
                      }
                    : undefined
                }
              >
                <input
                  type="radio"
                  name={field.key}
                  value={opt.value}
                  checked={value === opt.value}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  className="w-4 h-4"
                  style={{ accentColor }}
                />
                <span className={`text-sm ${cls.text}`}>
                  {lang === 'pl' ? opt.label.pl : opt.label.en}
                </span>
              </label>
            ))}
          </div>
        </div>
      )
    }

    if (field.type === 'checkbox') {
      const selectedValues = Array.isArray(value) ? value : []
      return (
        <div key={field.key} className="space-y-3">
          <label className={`block text-sm font-medium ${cls.text}`}>
            {fieldLabel}
            {field.required && <span className="text-r-error"> *</span>}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {field.options?.map((opt) => {
              const isChecked = selectedValues.includes(opt.value)
              return (
                <label
                  key={opt.value}
                  className={`flex items-center gap-3 cursor-pointer p-3 rounded-md-sm border transition-all duration-200 ${
                    isChecked
                      ? 'border-transparent'
                      : d
                        ? 'border-r-border-strong hover:border-r-white-muted bg-r-bg-card'
                        : 'border-gray-200 hover:border-gray-400 bg-white'
                  }`}
                  style={
                    isChecked
                      ? {
                          backgroundColor: d ? `${accentColor}08` : `${accentColor}0a`,
                          boxShadow: `0 0 0 2px ${accentColor}`,
                        }
                      : undefined
                  }
                >
                  <input
                    type="checkbox"
                    value={opt.value}
                    checked={isChecked}
                    onChange={(e) => {
                      if (e.target.checked) {
                        handleFieldChange(field.key, [...selectedValues, opt.value])
                      } else {
                        handleFieldChange(field.key, selectedValues.filter((v: string) => v !== opt.value))
                      }
                    }}
                    className="w-4 h-4 rounded"
                    style={{ accentColor }}
                  />
                  <span className={`text-sm ${cls.text}`}>
                    {lang === 'pl' ? opt.label.pl : opt.label.en}
                  </span>
                </label>
              )
            })}
          </div>
        </div>
      )
    }

    return null
  }

  // ============================================
  // STATUS SCREENS
  // ============================================

  if (status === 'loading') {
    return (
      <div className={`flex items-center justify-center min-h-screen ${cls.bg}`}>
        <div className="text-center">
          <Loader2 className={`animate-spin mx-auto mb-4 ${cls.textDim}`} size={32} />
          <p className={`text-sm ${cls.textDim}`}>{t('common.loading', lang)}</p>
        </div>
      </div>
    )
  }

  if (status === 'not-found') {
    return (
      <div className={`flex items-center justify-center min-h-screen ${cls.bg} px-4`}>
        <div className={`max-w-md w-full rounded-md-lg border ${cls.bgCard} ${cls.cardShadow}`}>
          <div className="py-16 px-6 text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${cls.bgElevated}`}>
              <span className={`text-2xl ${cls.text}`}>404</span>
            </div>
            <h1 className={`text-2xl font-semibold mb-2 ${cls.text}`}>{t('wizard.notFound', lang)}</h1>
            <p className={cls.textDim}>{t('wizard.notFoundMessage', lang)}</p>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'expired') {
    return (
      <div className={`flex items-center justify-center min-h-screen ${cls.bg} px-4`}>
        <div className={`max-w-md w-full rounded-md-lg border ${cls.bgCard} ${cls.cardShadow}`}>
          <div className="py-16 px-6 text-center">
            <div className="w-16 h-16 bg-r-warning/10 rounded-full flex items-center justify-center mx-auto mb-5">
              <Clock className="text-r-warning" size={28} />
            </div>
            <h1 className={`text-2xl font-semibold mb-2 ${cls.text}`}>{t('wizard.expired', lang)}</h1>
            <p className={cls.textDim}>{t('wizard.expiredMessage', lang)}</p>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${cls.bg}`}>
        <div className={`max-w-md w-full animate-scale-in rounded-md-lg border ${cls.bgCard} ${cls.cardShadow}`}>
          <div className="py-16 px-6 text-center">
            <div className="w-20 h-20 bg-r-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-r-success" />
            </div>
            <h1 className={`text-2xl font-semibold mb-3 ${cls.text}`}>{t('wizard.thankyou', lang)}</h1>
            <p className={`leading-relaxed ${cls.textDim}`}>{t('wizard.thankyouMessage', lang)}</p>
            <button
              onClick={() => {
                // Enter edit mode — go directly to wizard with existing data
                setCurrentStep(0)
                setStatus('wizard')
              }}
              className="inline-block mt-6 px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 hover:scale-[1.02] cursor-pointer"
              style={{
                backgroundColor: accentColorBtn,
                color: '#151515',
              }}
            >
              {lang === 'pl' ? 'Edytuj brief' : 'Edit brief'}
            </button>
            {brand && (
              <div className={`mt-8 pt-6 border-t ${cls.border}`}>
                {brand.logo_url && (
                  <img src={brand.logo_url} alt={brand.name_pl} className="h-8 object-contain mx-auto mb-2" />
                )}
                <p className={`text-sm ${cls.textDim}`}>
                  {lang === 'pl' ? brand.footer_signature_pl || brand.name_pl : brand.footer_signature_en || brand.name_en || brand.name_pl}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ============================================
  // WELCOME SCREEN
  // ============================================
  if (status === 'welcome' && brief) {
    return (
      <div className={`min-h-screen flex flex-col ${cls.bg} transition-colors duration-300`}>
        {/* Top bar — theme + language toggle */}
        <div className="w-full flex justify-end items-center gap-2 px-6 py-4">
          <ThemeToggle theme={theme} onThemeChange={setTheme} />
          <LanguageToggle currentLang={lang} onLangChange={setLang} variant="compact" theme={theme} />
        </div>

        {/* Main content — left-aligned */}
        <div className="flex-1 flex items-center">
          <div className="max-w-xl mx-auto w-full px-6 pb-16">
            <div className="animate-fade-in">
              <h1
                className={`text-5xl sm:text-6xl uppercase tracking-tight leading-none ${cls.text}`}
                style={{ fontFamily: 'Tanker, sans-serif' }}
              >
                Detailed Brief
              </h1>
              <p className={`text-lg mt-4 leading-relaxed max-w-md ${cls.textDim}`}>
                {lang === 'pl'
                  ? 'Powiedz nam więcej o tym jaki problem możemy pomóc Ci rozwiązać'
                  : 'Tell us more about the problem we can help you solve'}
              </p>
            </div>

            <div className="mt-10 animate-slide-up">
              <Button
                variant="primary"
                size="lg"
                onClick={handleStartWizard}
                className="gap-2"
                style={{ backgroundColor: accentColorBtn } as any}
              >
                {t('brand.start', lang)}
                <ArrowRight size={18} />
              </Button>

              <div className={`flex items-center gap-6 mt-8 text-xs ${cls.textMuted}`}>
                <div className="flex items-center gap-2">
                  <Clock size={14} />
                  <span>{t('wizard.estimatedTime', lang)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Save size={14} />
                  <span>{t('wizard.progressSaved', lang)}</span>
                </div>
              </div>
            </div>

            {brand?.disclaimer_pl && (
              <p className={`text-xs mt-12 max-w-sm leading-relaxed ${cls.textDim}`}>
                {lang === 'pl' ? brand.disclaimer_pl : brand.disclaimer_en || brand.disclaimer_pl}
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ============================================
  // SCOPE SELECTION — First step of new flow
  // ============================================
  if (status === 'scope' && brief) {
    return (
      <div className={`min-h-screen ${cls.bg} transition-colors duration-300`}>
        <div className={`${cls.bgCard} border-b ${cls.border}`}>
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {brand?.logo_url && (
                <img src={brand.logo_url} alt={brand.name_pl} className="h-8 object-contain" />
              )}
              <span className={`text-sm font-medium ${cls.text}`}>
                {brand ? (lang === 'pl' ? brand.name_pl : brand.name_en || brand.name_pl) : 'Detailed Brief'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle theme={theme} onThemeChange={setTheme} />
              <LanguageToggle currentLang={lang} onLangChange={setLang} variant="compact" theme={theme} />
            </div>
          </div>
        </div>

        <div className="max-w-xl mx-auto px-4 pt-12 pb-8">
          <div className="text-center mb-8 animate-fade-in">
            <h2 className={`text-2xl font-semibold mb-2 ${cls.text}`}>
              {t('wizard.scopeTitle', lang)}
            </h2>
            <p className={cls.textDim}>
              {t('wizard.scopeSubtitle', lang)}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 stagger-children">
            {scopeOptions.map((option) => {
              const isSelected = selectedScope === option.value
              const stepsCount = getStepsForScope(option.value).length
              return (
                <button
                  key={option.value}
                  onClick={() => handleSelectScope(option.value)}
                  className={`text-left p-4 rounded-md-lg border-2 transition-all duration-200 ${
                    isSelected
                      ? ''
                      : d
                        ? 'border-r-border bg-r-bg-card shadow-md-1 hover:shadow-md-2'
                        : 'border-gray-200 bg-white shadow-sm hover:shadow-md'
                  }`}
                  style={
                    isSelected
                      ? {
                          backgroundColor: d ? `${accentColor}08` : `${accentColor}0a`,
                          borderColor: accentColor,
                        }
                      : undefined
                  }
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-base ${cls.text}`}>
                        {lang === 'pl' ? option.label.pl : option.label.en}
                      </p>
                      <p className={`text-[11px] mt-0.5 leading-snug ${cls.textDim}`}>
                        {lang === 'pl' ? option.description.pl : option.description.en}
                      </p>
                    </div>
                    <CheckCircle
                      size={20}
                      className={`shrink-0 transition-opacity duration-200 ${isSelected ? 'opacity-100' : 'opacity-0'}`}
                      style={{ color: accentColor }}
                    />
                  </div>
                </button>
              )
            })}
          </div>

          <div className="mt-8 flex gap-3">
            <button
              onClick={() => setStatus('welcome')}
              className={`inline-flex items-center justify-center gap-2 rounded-full font-medium px-5 py-2.5 text-sm h-10 transition-all duration-200 border ${
                d ? 'bg-r-bg-card text-white border-r-border-strong hover:bg-r-bg-input' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <ChevronLeft size={16} />
              {t('wizard.previous', lang)}
            </button>
            <button
              onClick={handleScopeConfirm}
              disabled={!selectedScope}
              className={`flex-1 inline-flex items-center justify-center gap-2 rounded-full font-bold px-6 py-3 text-base h-12 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed`}
              style={selectedScope ? { backgroundColor: accentColorBtn, color: '#151515' } as any : { backgroundColor: d ? '#333' : '#ddd', color: d ? '#666' : '#999' }}
            >
              {t('wizard.next', lang)}
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ============================================
  // WIZARD — with theme support
  // ============================================
  if (status === 'wizard' && brief) {
    const step = activeSteps[currentStep]
    if (!step) return null
    const progress = ((currentStep + 1) / activeSteps.length) * 100
    const isLastStep = currentStep === activeSteps.length - 1

    const sliderFields = step.fields.filter((f) => f.type === 'slider')
    const hasSliders = sliderFields.length > 2

    return (
      <div className={`min-h-screen pb-8 ${cls.bg} transition-colors duration-300`}>
        {/* Sticky top bar */}
        <div className={`sticky top-0 z-10 backdrop-blur-md border-b ${cls.border}`} style={{ backgroundColor: d ? 'rgba(21,21,21,0.95)' : 'rgba(249,250,251,0.95)' }}>
          <div className="max-w-2xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {brand?.logo_url && (
                  <img src={brand.logo_url} alt={brand.name_pl} className="h-6 object-contain" />
                )}
                <div className="flex items-center gap-1">
                  {isSaving && (
                    <span className={`flex items-center gap-1.5 text-xs ${cls.textDim}`}>
                      <Loader2 className="animate-spin" size={12} />
                      {t('wizard.saving', lang)}
                    </span>
                  )}
                  {!isSaving && saveError && (
                    <span className="flex items-center gap-1.5 text-xs text-red-400">
                      <X size={12} />
                      {saveError}
                    </span>
                  )}
                  {!isSaving && !saveError && lastSaved && (
                    <span className="flex items-center gap-1.5 text-xs text-r-success">
                      <CheckCircle size={12} />
                      {lastSaved}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <ThemeToggle theme={theme} onThemeChange={setTheme} />
                <LanguageToggle currentLang={lang} onLangChange={setLang} variant="compact" theme={theme} />
              </div>
            </div>
            {/* Step bubbles */}
            <div className="flex items-center justify-center gap-2">
              {activeSteps.map((s, i) => {
                const isCompleted = i < currentStep
                const isCurrent = i === currentStep
                return (
                  <button
                    key={s.key}
                    onClick={() => {
                      saveStepData(allData, currentStep)
                      setCurrentStep(i)
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      isCurrent
                        ? 'scale-110 shadow-lg'
                        : isCompleted
                        ? 'cursor-pointer hover:scale-105'
                        : 'opacity-40'
                    }`}
                    style={{
                      backgroundColor: isCurrent
                        ? accentColorBtn
                        : isCompleted
                        ? (d ? `${accentColorBtn}30` : `${accentColorBtn}25`)
                        : (d ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
                      color: isCurrent
                        ? '#151515'
                        : isCompleted
                        ? accentColorBtn
                        : (d ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)'),
                      border: isCurrent
                        ? 'none'
                        : isCompleted
                        ? `1.5px solid ${accentColorBtn}50`
                        : `1.5px solid ${d ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                    }}
                    title={`${t('wizard.step', lang)} ${i + 1}: ${lang === 'pl' ? s.title.pl : s.title.en}`}
                  >
                    {isCompleted ? '\u2713' : i + 1}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="max-w-2xl mx-auto px-4 mt-6">
          {/* Validation errors banner */}
          {validationErrors.length > 0 && (
            <div className={`mb-4 rounded-md-lg border px-4 py-3 flex items-start gap-3 animate-fade-in ${
              d ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200'
            }`}>
              <div className={`shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center ${
                d ? 'bg-red-500/20' : 'bg-red-100'
              }`}>
                <X size={12} className={d ? 'text-red-400' : 'text-red-600'} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${d ? 'text-red-400' : 'text-red-700'}`}>
                  {lang === 'pl' ? 'Uzupełnij wymagane pola:' : 'Please fill in required fields:'}
                </p>
                <ul className={`mt-1 text-sm ${d ? 'text-red-400/70' : 'text-red-600'}`}>
                  {validationErrors.map((err) => (
                    <li key={err}>• {err}</li>
                  ))}
                </ul>
              </div>
              <button onClick={() => setValidationErrors([])} className={`shrink-0 p-0.5 rounded hover:bg-red-500/20 ${d ? 'text-red-400' : 'text-red-500'}`}>
                <X size={14} />
              </button>
            </div>
          )}
          <div className={`rounded-md-lg border animate-fade-in ${cls.bgCard} ${cls.cardShadow}`}>
            <div className="px-6 pt-6 pb-2">
              <h2 className={`text-xl font-semibold ${cls.text}`}>
                {lang === 'pl' ? step.title.pl : step.title.en}
              </h2>
              <p className={`text-sm mt-1 ${cls.textDim}`}>
                {lang === 'pl' ? step.description.pl : step.description.en}
              </p>
            </div>
            <div className="px-6 py-5">
              <div className="space-y-6">
                {step.fields.map((field) => {
                  if (hasSliders && field.type === 'slider') return null
                  return renderField(field)
                })}

                {hasSliders && (
                  <div className="pt-2">
                    <p className={`text-xs mb-4 ${cls.textDim}`}>
                      {t('wizard.sliderInstruction', lang)}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                      {sliderFields.map((field) => (
                        <SliderField
                          key={field.key}
                          field={field}
                          value={typeof allData[field.key] === 'number' ? allData[field.key] : 5}
                          onChange={(val) => handleFieldChange(field.key, val)}
                          lang={lang}
                          accentColor={accentColor}
                          dark={d}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className={`flex gap-3 pt-8 mt-8 border-t ${cls.border}`}>
                {/* Back button — hidden on first step */}
                {currentStep > 0 && (
                  <button
                    onClick={handlePreviousStep}
                    className={`inline-flex items-center justify-center gap-2 rounded-full font-medium px-5 py-2.5 text-sm h-10 transition-all duration-200 border ${
                      d ? 'bg-r-bg-card text-white border-r-border-strong hover:bg-r-bg-input' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <ChevronLeft size={16} />
                    {t('wizard.previous', lang)}
                  </button>
                )}
                {/* Manual save button */}
                <button
                  onClick={async () => {
                    const saved = await saveStepData(allData, currentStep, false)
                    if (saved) {
                      dataChangedRef.current = false
                      setSaveError(null)
                    } else {
                      setSaveError(lang === 'pl' ? 'Zapis nie powiódł się' : 'Save failed')
                    }
                  }}
                  disabled={isSaving}
                  className={`inline-flex items-center justify-center gap-2 rounded-full font-medium px-4 py-2.5 text-sm h-10 transition-all duration-200 border ${
                    d ? 'bg-r-bg-card text-white border-r-border-strong hover:bg-r-bg-input' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                  title={lang === 'pl' ? 'Zapisz teraz' : 'Save now'}
                >
                  <Save size={16} />
                </button>
                {/* Next / Save brief button */}
                {isLastStep ? (
                  <button
                    onClick={handleNextStep}
                    disabled={isSubmitting}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-full font-bold px-5 py-2.5 text-sm h-10 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ backgroundColor: accentColorBtn, color: '#151515' }}
                  >
                    {isSubmitting && (
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    {lang === 'pl' ? 'Zapisz brief' : 'Save brief'}
                    <CheckCircle size={16} />
                  </button>
                ) : (
                  <button
                    onClick={handleNextStep}
                    disabled={isSubmitting}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-full font-bold px-5 py-2.5 text-sm h-10 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ backgroundColor: accentColorBtn, color: '#151515' }}
                  >
                    {t('wizard.next', lang)}
                    <ChevronRight size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Step indicators removed — using bubbles in top bar */}

          {/* Scope badge (read-only) */}
          {selectedScope && (
            <div className="flex justify-center mt-3">
              <span
                className={`text-xs flex items-center gap-1 ${
                  d ? 'text-r-white-dim' : 'text-gray-500'
                }`}
              >
                {lang === 'pl'
                  ? scopeOptions.find((s) => s.value === selectedScope)?.label.pl
                  : scopeOptions.find((s) => s.value === selectedScope)?.label.en}
              </span>
            </div>
          )}
        </div>
      </div>
    )
  }

  return null
}
