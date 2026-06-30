'use client'

import { useEffect, useState } from 'react'
import { useRouter } from '@/router'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { Plus, Trash2, Package, CheckCircle2 } from 'lucide-react'
import MultiStepModal from '@/components/dashboard/modals/MultiStepModal'
import ModalFooterNav from '@/components/dashboard/modals/ModalFooterNav'
import { FormField, formInputClass } from '@/components/dashboard/ui/FormField'
import {
  persistProduitFiniCatalogue,
  submitNomenclatureBomOnly,
} from '@/services/actions/nomenclatures'
import {
  formuleCatalogueEtape1Schema,
  formuleLignesSchema,
  type FormuleCatalogueEtape1,
} from '@/lib/validations/nomenclatures'
import { generateCode } from '@/lib/dashboard/generate-code'

const STEPS = ['Catalogue produit', 'Composition BOM', 'Validation']

const UNITE_LABELS: Record<'bouteille' | 'carton', string> = {
  bouteille: 'Bouteille',
  carton: 'Carton',
}

type CatalogueFormValues = {
  catalogue: FormuleCatalogueEtape1
  lignes: { lignes: { composant_id: string; quantite_requise: number }[] }
  validation: { signatureConfirmee: boolean }
}

const defaultValues: CatalogueFormValues = {
  catalogue: {
    mode: 'new',
    nom: '',
    code: '',
    unite_commerciale: 'bouteille',
    prix_vente: 0,
  },
  lignes: {
    lignes: [{ composant_id: '', quantite_requise: 0 }],
  },
  validation: { signatureConfirmee: false },
}

interface NouvelleFormuleModalProps {
  open: boolean
  onClose: () => void
  produitsFinis: {
    id: string
    code: string
    nom: string
    volume_litre: number | null
    unite_commerciale?: string | null
  }[]
  composants: { id: string; code: string; nom: string; unite_mesure: string }[]
}

export default function NouvelleFormuleModal({
  open,
  onClose,
  produitsFinis,
  composants,
}: NouvelleFormuleModalProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [serverError, setServerError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isAdvancing, setIsAdvancing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [produitFiniId, setProduitFiniId] = useState<string | null>(null)
  const [produitResume, setProduitResume] = useState<{
    nom: string
    code: string
    unite: string
  } | null>(null)

  const form = useForm<CatalogueFormValues>({
    defaultValues,
    mode: 'onChange',
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'lignes.lignes',
  })

  const { watch, reset, setValue, formState } = form
  const catalogue = watch('catalogue')

  useEffect(() => {
    if (open) {
      reset(defaultValues)
      setStep(1)
      setServerError(null)
      setFieldErrors({})
      setProduitFiniId(null)
      setProduitResume(null)
    }
  }, [open, reset])

  function applyZodErrors(issues: { path: PropertyKey[]; message: string }[]) {
    const errs: Record<string, string> = {}
    issues.forEach((issue) => {
      const key = issue.path.map(String).join('.')
      errs[key || '_root'] = issue.message
    })
    setFieldErrors(errs)
  }

  function validateStepLocal(s: number): boolean {
    setFieldErrors({})
    setServerError(null)
    const values = form.getValues()

    if (s === 1) {
      const parsed = formuleCatalogueEtape1Schema.safeParse(values.catalogue)
      if (!parsed.success) {
        applyZodErrors(parsed.error.issues)
        return false
      }
    }
    if (s === 2) {
      const parsed = formuleLignesSchema.safeParse(values.lignes)
      if (!parsed.success) {
        applyZodErrors(parsed.error.issues)
        return false
      }
    }
    return true
  }

  function buildProduitResume(id: string) {
    const cat = form.getValues('catalogue')
    if (cat.mode === 'new') {
      return {
        nom: cat.nom,
        code: cat.code.toUpperCase(),
        unite: UNITE_LABELS[cat.unite_commerciale],
      }
    }
    const p = produitsFinis.find((x) => x.id === id)
    return {
      nom: p?.nom ?? '—',
      code: p?.code ?? '—',
      unite: p?.unite_commerciale
        ? UNITE_LABELS[p.unite_commerciale as 'bouteille' | 'carton'] ??
          p.unite_commerciale
        : '—',
    }
  }

  async function handleNext() {
    if (!validateStepLocal(step)) return

    if (step === 1) {
      setIsAdvancing(true)
      setServerError(null)
      const cat = form.getValues('catalogue')
      const payload =
        cat.mode === 'new'
          ? {
              mode: 'new' as const,
              nom: cat.nom,
              code: cat.code,
              unite_commerciale: cat.unite_commerciale,
              prix_vente: cat.prix_vente,
              draft_produit_fini_id: produitFiniId ?? undefined,
            }
          : { mode: 'existing' as const, produit_fini_id: cat.produit_fini_id }

      try {
        const result = await persistProduitFiniCatalogue(payload)
        if (result.error) {
          setServerError(result.error)
          return
        }
        if (!result.id) {
          setServerError('Impossible de récupérer le produit catalogue.')
          return
        }

        setProduitFiniId(result.id)
        setProduitResume(buildProduitResume(result.id))
        setStep(2)
      } catch (error) {
        setServerError(error instanceof Error ? error.message : 'Impossible d’enregistrer le produit catalogue.')
      } finally {
        setIsAdvancing(false)
      }
      return
    }

    setStep((s) => Math.min(s + 1, STEPS.length))
  }

  async function handleSubmit() {
    if (!validateStepLocal(2)) {
      setStep(2)
      return
    }
    if (!produitFiniId) {
      setServerError('Produit catalogue non défini. Revenez à l’étape 1.')
      setStep(1)
      return
    }

    setServerError(null)
    setIsSubmitting(true)
    try {
      const values = form.getValues()
      const result = await submitNomenclatureBomOnly({
        produit_fini_id: produitFiniId,
        lignes: values.lignes.lignes,
        validation: values.validation,
      })
      if (result.error) {
        setServerError(result.error)
        return
      }
      onClose()
      router.refresh()
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Impossible de valider la recette.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const catalogueFieldError = (field: string) => {
    const key = `catalogue.${field}`
    return fieldErrors[key] ?? (formState.errors.catalogue as Record<string, { message?: string }>)?.[field]?.message
  }

  return (
    <MultiStepModal
      open={open}
      title="Catalogue produit & recette BOM"
      subtitle="Déclarez un nouveau produit fini puis configurez sa recette standard"
      steps={STEPS}
      currentStep={step}
      isDirty={formState.isDirty}
      onClose={onClose}
      footer={
        <ModalFooterNav
          currentStep={step}
          totalSteps={STEPS.length}
          onPrevious={() => {
            setServerError(null)
            setFieldErrors({})
            setStep((s) => s - 1)
          }}
          onNext={handleNext}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting || isAdvancing}
          submitLabel="Valider la recette"
        />
      }
    >
      {serverError && (
        <div className="mb-4 rounded-md border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {serverError}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div className="rounded-md border border-blue-100 bg-blue-50/60 px-4 py-3 text-xs leading-relaxed text-slate-600">
            <p className="font-semibold text-slate-800">Catalogue de produits finis</p>
            <p className="mt-1">
              Avant de composer la recette, enregistrez le contenant commercial (nom, SKU,
              unité). Le produit est créé dans le catalogue dès le passage à l&apos;étape
              suivante.
            </p>
          </div>

          <Controller
            name="catalogue.mode"
            control={form.control}
            render={({ field }) => (
              <div className="flex gap-2 rounded-md border border-slate-100 bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={() => {
                    field.onChange('new')
                    setValue('catalogue', {
                      mode: 'new',
                      nom: '',
                      code: '',
                      unite_commerciale: 'bouteille',
                      prix_vente: 0,
                    })
                    setProduitFiniId(null)
                  }}
                  className={`flex-1 rounded-md py-2 text-xs font-semibold transition-colors ${
                    field.value === 'new' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Nouveau produit catalogue
                </button>
                <button
                  type="button"
                  onClick={() => {
                    field.onChange('existing')
                    setValue('catalogue', {
                      mode: 'existing',
                      produit_fini_id: '',
                    })
                    setProduitFiniId(null)
                  }}
                  className={`flex-1 rounded-md py-2 text-xs font-semibold transition-colors ${
                    field.value === 'existing'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500'
                  }`}
                >
                  Produit déjà au catalogue
                </button>
              </div>
            )}
          />

          {catalogue.mode === 'existing' ? (
            <FormField
              label="Produit du catalogue"
              required
              error={catalogueFieldError('produit_fini_id')}
            >
              <select
                className={formInputClass(!!catalogueFieldError('produit_fini_id'))}
                value={catalogue.produit_fini_id ?? ''}
                onChange={(e) =>
                  setValue(
                    'catalogue',
                    { mode: 'existing', produit_fini_id: e.target.value },
                    { shouldDirty: true }
                  )
                }
              >
                <option value="">— Sélectionner —</option>
                {produitsFinis.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nom} ({p.code})
                  </option>
                ))}
              </select>
            </FormField>
          ) : (
            <>
              <FormField
                label="Nom du produit"
                htmlFor="nom"
                required
                error={catalogueFieldError('nom')}
              >
                <input
                  id="nom"
                  className={formInputClass(!!catalogueFieldError('nom'))}
                  placeholder="Ex. Vin Ushindi Rouge 750 ml"
                  {...form.register('catalogue.nom', {
                    onChange: (event) => setValue('catalogue.code', generateCode(event.target.value, 'PRODUIT'), { shouldDirty: true }),
                  })}
                />
              </FormField>
              <FormField
                label="Code SKU unique (automatique)"
                htmlFor="code"
                required
                error={catalogueFieldError('code')}
              >
                <input
                  id="code"
                  readOnly
                  tabIndex={-1}
                  onFocus={(event) => event.currentTarget.blur()}
                  className={`${formInputClass(!!catalogueFieldError('code'))} pointer-events-none cursor-not-allowed bg-slate-100 font-mono uppercase`}
                  placeholder="Ex. VU-ROUGE-750"
                  {...form.register('catalogue.code')}
                />
              </FormField>
              <FormField
                label="Unité de mesure commerciale"
                htmlFor="unite"
                required
                error={catalogueFieldError('unite_commerciale')}
              >
                <select
                  id="unite"
                  className={formInputClass(!!catalogueFieldError('unite_commerciale'))}
                  value={catalogue.unite_commerciale}
                  onChange={(e) =>
                    setValue(
                      'catalogue',
                      {
                        ...catalogue,
                        unite_commerciale: e.target.value as 'bouteille' | 'carton',
                      },
                      { shouldDirty: true }
                    )
                  }
                >
                  <option value="bouteille">Bouteille</option>
                  <option value="carton">Carton</option>
                </select>
              </FormField>
              <FormField
                label="Prix de vente unitaire (FCFA)"
                htmlFor="prixVente"
                required
                error={catalogueFieldError('prix_vente')}
              >
                <input
                  id="prixVente"
                  type="number"
                  min="1"
                  step="0.01"
                  className={formInputClass(!!catalogueFieldError('prix_vente'))}
                  {...form.register('catalogue.prix_vente', { valueAsNumber: true })}
                />
              </FormField>
            </>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          {produitResume && (
            <div className="flex items-start gap-3 rounded-md border border-emerald-100 bg-emerald-50/60 px-4 py-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <div className="min-w-0 text-xs">
                <p className="font-semibold text-slate-800">Produit catalogue enregistré</p>
                <p className="mt-0.5 text-slate-600">
                  {produitResume.nom}{' '}
                  <span className="font-mono text-slate-500">({produitResume.code})</span>
                  {' · '}
                  {produitResume.unite}
                </p>
                <p className="mt-1 text-slate-500">
                  Ajoutez les intrants nécessaires pour fabriquer une unité de ce produit.
                </p>
              </div>
            </div>
          )}

          {(fieldErrors['lignes.lignes'] || fieldErrors.lignes) && (
            <p className="text-xs text-rose-600">
              {fieldErrors['lignes.lignes'] ?? fieldErrors.lignes}
            </p>
          )}

          {fields.map((field, index) => (
            <div
              key={field.id}
              className="flex flex-col gap-3 rounded-md border border-slate-100 bg-slate-50/50 p-3 sm:flex-row sm:items-end"
            >
              <div className="min-w-0 flex-1">
                <FormField
                  label="Intrant / composant"
                  error={
                    fieldErrors[`lignes.lignes.${index}.composant_id`] ??
                    formState.errors.lignes?.lignes?.[index]?.composant_id?.message
                  }
                >
                  <select
                    className={formInputClass(
                      !!fieldErrors[`lignes.lignes.${index}.composant_id`]
                    )}
                    {...form.register(`lignes.lignes.${index}.composant_id`)}
                  >
                    <option value="">— Composant —</option>
                    {composants.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nom} ({c.unite_mesure})
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>
              <div className="w-full sm:w-40">
                <FormField
                  label="Qté standard / unité"
                  error={
                    fieldErrors[`lignes.lignes.${index}.quantite_requise`] ??
                    formState.errors.lignes?.lignes?.[index]?.quantite_requise?.message
                  }
                >
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    className={formInputClass(
                      !!fieldErrors[`lignes.lignes.${index}.quantite_requise`]
                    )}
                    {...form.register(`lignes.lignes.${index}.quantite_requise`, {
                      valueAsNumber: true,
                    })}
                  />
                </FormField>
              </div>
              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                  aria-label="Supprimer la ligne"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => append({ composant_id: '', quantite_requise: 0 })}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900"
          >
            <Plus className="h-4 w-4" />
            Ajouter un intrant
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-4 text-sm">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-slate-500" />
              <h3 className="font-bold text-slate-900">Récapitulatif catalogue & recette</h3>
            </div>
            {produitResume && (
              <dl className="mt-3 space-y-1 border-b border-slate-100 pb-3 text-xs">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Produit</dt>
                  <dd className="font-medium text-slate-800">{produitResume.nom}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">SKU</dt>
                  <dd className="font-mono font-medium">{produitResume.code}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Unité</dt>
                  <dd className="font-medium">{produitResume.unite}</dd>
                </div>
              </dl>
            )}
            <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Composition BOM
            </p>
            <ul className="mt-2 space-y-1">
              {watch('lignes.lignes').map((l, i) => {
                const comp = composants.find((c) => c.id === l.composant_id)
                return (
                  <li key={i} className="flex justify-between text-slate-600">
                    <span>{comp?.nom ?? '—'}</span>
                    <span className="font-medium tabular-nums">
                      {l.quantite_requise} {comp?.unite_mesure ?? ''}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
          <div className="rounded-md border border-blue-100 bg-blue-50 p-4 text-sm text-slate-700">
            Le bouton « Valider la recette » confirme et enregistre définitivement cette composition dans PostgreSQL.
          </div>
        </div>
      )}
    </MultiStepModal>
  )
}
