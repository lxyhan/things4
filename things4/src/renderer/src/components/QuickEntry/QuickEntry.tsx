import React, { useState, useRef, useEffect } from 'react'
import { WhenPicker } from '../DatePicker/WhenPicker'
import { DeadlinePicker } from '../DatePicker/DeadlinePicker'
import { TagPicker } from '../TagPicker/TagPicker'
import type { Tag } from '../../../../types'
import styles from './QuickEntry.module.css'

type ActivePicker = 'when' | 'deadline' | 'tags' | null

function formatWhen(when: string | null): string {
  if (!when) return 'When'
  if (when === 'today') return 'Today'
  if (when === 'evening') return 'Evening'
  if (when === 'someday') return 'Someday'
  // ISO date
  const d = new Date(when + 'T00:00:00')
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function formatDeadline(deadline: string | null): string {
  if (!deadline) return 'Deadline'
  const d = new Date(deadline + 'T00:00:00')
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export interface QuickEntryProps {
  onClose?: () => void
}

export function QuickEntry({ onClose }: QuickEntryProps): React.JSX.Element {
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [when, setWhen] = useState<string | null>(null)
  const [deadline, setDeadline] = useState<string | null>(null)
  const [tagIds, setTagIds] = useState<string[]>([])
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [activePicker, setActivePicker] = useState<ActivePicker>(null)
  const [saving, setSaving] = useState(false)

  const titleRef = useRef<HTMLInputElement>(null)
  const whenBtnRef = useRef<HTMLButtonElement>(null)
  const deadlineBtnRef = useRef<HTMLButtonElement>(null)
  const tagsBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  useEffect(() => {
    window.api?.tags?.list().then(setAllTags).catch(() => setAllTags([]))
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activePicker === null) {
        onClose?.()
        return
      }
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        handleSave()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  })

  const handleSave = async () => {
    if (!title.trim() || saving) return
    setSaving(true)
    try {
      await window.api?.tasks?.create({
        title: title.trim(),
        notes: notes.trim() || null,
        when_date: when,
        deadline: deadline,
        tag_ids: tagIds
      })
      onClose?.()
    } catch {
      setSaving(false)
    }
  }

  const togglePicker = (picker: ActivePicker) => {
    setActivePicker(prev => prev === picker ? null : picker)
  }

  const selectedTagNames = tagIds
    .map(id => allTags.find(t => t.id === id))
    .filter((t): t is Tag => Boolean(t))

  const hasWhen = Boolean(when)
  const hasDeadline = Boolean(deadline)
  const hasTags = tagIds.length > 0

  return (
    <div className={styles.panel}>
      <div className={styles.inputSection}>
        <input
          ref={titleRef}
          className={styles.titleInput}
          placeholder="New To-Do"
          value={title}
          onChange={e => setTitle(e.target.value)}
          autoFocus
        />
        <textarea
          className={styles.notesInput}
          placeholder="Notes"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
        />
      </div>

      {selectedTagNames.length > 0 && (
        <div className={styles.tagChips}>
          {selectedTagNames.map(tag => (
            <span
              key={tag.id}
              className={styles.tagChip}
              style={{ borderColor: tag.color ?? 'var(--color-border)' }}
            >
              <span
                className={styles.tagChipDot}
                style={{ background: tag.color ?? 'var(--color-text-tertiary)' }}
              />
              {tag.name}
              <button
                className={styles.tagChipRemove}
                onMouseDown={e => {
                  e.preventDefault()
                  setTagIds(ids => ids.filter(id => id !== tag.id))
                }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <button
            ref={whenBtnRef}
            className={`${styles.toolBtn} ${hasWhen ? styles.toolBtnActive : ''}`}
            onMouseDown={e => { e.preventDefault(); togglePicker('when') }}
            title="When"
          >
            <span className={styles.toolIcon}>★</span>
            <span>{formatWhen(when)}</span>
            {hasWhen && (
              <span
                className={styles.clearBtn}
                onMouseDown={e => { e.stopPropagation(); e.preventDefault(); setWhen(null) }}
              >
                ×
              </span>
            )}
          </button>

          <button
            ref={deadlineBtnRef}
            className={`${styles.toolBtn} ${hasDeadline ? styles.toolBtnDeadline : ''}`}
            onMouseDown={e => { e.preventDefault(); togglePicker('deadline') }}
            title="Deadline"
          >
            <span className={styles.toolIcon}>⚑</span>
            <span>{formatDeadline(deadline)}</span>
            {hasDeadline && (
              <span
                className={styles.clearBtn}
                onMouseDown={e => { e.stopPropagation(); e.preventDefault(); setDeadline(null) }}
              >
                ×
              </span>
            )}
          </button>

          <button
            ref={tagsBtnRef}
            className={`${styles.toolBtn} ${hasTags ? styles.toolBtnActive : ''}`}
            onMouseDown={e => { e.preventDefault(); togglePicker('tags') }}
            title="Tags"
          >
            <span className={styles.toolIcon}>#</span>
            <span>{hasTags ? `${tagIds.length} tag${tagIds.length > 1 ? 's' : ''}` : 'Tags'}</span>
          </button>
        </div>

        <div className={styles.toolbarRight}>
          <button
            className={styles.cancelBtn}
            onMouseDown={e => { e.preventDefault(); onClose?.() }}
          >
            Cancel
          </button>
          <button
            className={`${styles.saveBtn} ${!title.trim() ? styles.saveBtnDisabled : ''}`}
            onMouseDown={e => { e.preventDefault(); handleSave() }}
            disabled={!title.trim() || saving}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {activePicker === 'when' && (
        <WhenPicker
          value={when}
          onChange={val => { setWhen(val); setActivePicker(null) }}
          onClose={() => setActivePicker(null)}
          anchorEl={whenBtnRef.current}
        />
      )}

      {activePicker === 'deadline' && (
        <DeadlinePicker
          value={deadline}
          onChange={val => { setDeadline(val); setActivePicker(null) }}
          onClose={() => setActivePicker(null)}
          anchorEl={deadlineBtnRef.current}
        />
      )}

      {activePicker === 'tags' && (
        <TagPicker
          selectedIds={tagIds}
          onChange={ids => setTagIds(ids)}
          onClose={() => setActivePicker(null)}
          anchorEl={tagsBtnRef.current}
        />
      )}
    </div>
  )
}
