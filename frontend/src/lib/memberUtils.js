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

// Get member color by member object or name
export const getMemberColor = (memberOrName) => {
    if (typeof memberOrName === 'object' && memberOrName !== null) {
        if (memberOrName.color) return memberOrName.color
        return getMemberColor(memberOrName.nama_panggung)
    }
    const clean = sanitizeName(memberOrName)
    return memberData[clean]?.color || '#9D26FF'
}

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
