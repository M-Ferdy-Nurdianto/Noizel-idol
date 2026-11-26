// Dynamic member utility functions for NOIZE

export const memberData = {
    'group': {
        color: '#9D26FF',
        name: 'Noize',
        gradient: 'from-[#9D26FF] to-[#9D26FF]',
    }
}

// Sanitize name for lookup
export const sanitizeName = (name) => {
    if (!name) return ''
    return name.toLowerCase().replace(/[^a-z0-9]/g, '')
}

// Get member color (follows website purple theme)
export const getMemberColor = () => '#9D26FF'

// Get member data by name
export const getMemberData = (name) => {
    const clean = sanitizeName(name)
    return memberData[clean] || {
        color: '#9D26FF',
        name: name || 'Member',
        gradient: 'from-[#9D26FF] to-[#9D26FF]'
    }
}

// Get clean member display name
export const getMemberDisplayName = (name) => {
    return name || 'Member'
}

// Format member name
export const formatMemberName = (name) => {
    return name || 'Member'
}
