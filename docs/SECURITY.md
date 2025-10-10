# Security Guidelines

## Overview
This document outlines critical security practices for the Donee healthcare management system. Medical data requires the highest level of protection.

## Patient Data Access (CRITICAL)

### ⚠️ NEVER query `pacientes` table directly
Always use the secure function instead:
```typescript
// ❌ WRONG - Bypasses role-based security
const { data } = await supabase
  .from('pacientes')
  .select('*');

// ✅ CORRECT - Enforces role-based column filtering
const { data } = await supabase
  .rpc('get_patients_for_role');
```

### Role-Based Access Levels
- **Profissionais**: Full access to all patient data including medical observations
- **Recepcionistas**: LIMITED access - can only see basic contact info (name, CPF, email, phone)
- **Admins**: Full access to all data

### Sensitive Fields (Restricted from Receptionists)
- `observacoes` - Medical observations
- `endereco`, `cep`, `cidade`, `estado`, `bairro` - Full address details
- `origem` - Patient origin/referral source
- `modalidade_atendimento` - Treatment modality

### Helper Function
Check if current user can see sensitive data:
```typescript
const { data: canSee } = await supabase
  .rpc('can_see_patient_sensitive_data');
```

## User Data Access

### ⚠️ NEVER query `users` table directly
Always use the safe view or functions:
```typescript
// ❌ WRONG - Exposes senha_hash, stripe_*, subscription_*
const { data } = await supabase
  .from('users')
  .select('*');

// ✅ CORRECT - Only safe fields
const { data } = await supabase
  .from('users_safe')
  .select('*');

// ✅ CORRECT - Get specific user safely
const { data } = await supabase
  .rpc('get_safe_user_profile', { _user_id: userId });

// ✅ CORRECT - Get clinic users safely
const { data } = await supabase
  .rpc('get_clinic_users_safe');
```

### Protected User Fields (NEVER expose)
- `senha_hash` - Password hash
- `stripe_customer_id` - Stripe customer ID
- `subscription_id` - Stripe subscription ID
- `subscription_status` - Internal subscription status

## Role Checks

### Client-Side vs Server-Side
⚠️ **CRITICAL**: Client-side role checks are for UX only, NOT security!

```typescript
// ❌ WRONG - Client-side check for authorization
if (userProfile.tipo_usuario === 'admin') {
  // Show sensitive action
}

// ✅ CORRECT - Server-side enforcement via RLS policies
// The database RLS policies and security definer functions
// automatically enforce authorization
```

### How Security Works
1. **RLS Policies**: Database-level row access control
2. **Security Definer Functions**: Execute with elevated privileges but enforce role checks
3. **Client-side Checks**: Only for UI/UX (hiding buttons, etc.)

## Input Validation

### CPF Validation
```typescript
// Always validate CPF with algorithm check
const validateCPF = (cpf: string): boolean => {
  const cleanCPF = cpf.replace(/\D/g, '');
  if (cleanCPF.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
  
  // Check digits validation
  // ... (see PacienteForm.tsx for full implementation)
  return true;
};
```

### Phone Validation
```typescript
// Brazilian phone format: 10 or 11 digits
telefone: z.string()
  .optional()
  .refine((val) => {
    if (!val) return true;
    const clean = val.replace(/\D/g, '');
    return clean.length === 10 || clean.length === 11;
  }, 'Telefone deve ter 10 ou 11 dígitos')
```

### Email Validation
```typescript
// Prevent injection attacks
email: z.string()
  .email('Email inválido')
  .max(255, 'Email muito longo')
  .refine((val) => {
    if (!val) return true;
    return !/[<>\"'\[\]\\]/.test(val);
  }, 'Email contém caracteres inválidos')
```

## Password Requirements

### Strong Password Policy
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (!@#$%^&*)

```typescript
// Validation in Auth.tsx
if (password.length < 8) throw new Error('Senha muito curta');
if (!/[A-Z]/.test(password)) throw new Error('Falta maiúscula');
if (!/[a-z]/.test(password)) throw new Error('Falta minúscula');
if (!/[0-9]/.test(password)) throw new Error('Falta número');
if (!/[^A-Za-z0-9]/.test(password)) throw new Error('Falta caractere especial');
```

## Edge Functions Security

### Authentication Check
```typescript
// ⚠️ ALWAYS check authentication explicitly
const authHeader = req.headers.get("Authorization");
if (!authHeader) {
  return new Response(
    JSON.stringify({ error: "Authorization header missing" }),
    { status: 401 }
  );
}

const { data, error } = await supabase.auth.getUser(token);
if (error || !data.user) {
  return new Response(
    JSON.stringify({ error: "Unauthorized" }),
    { status: 401 }
  );
}
```

### Role Verification
```typescript
// Verify user has required role before processing
const { data: profissional } = await supabase
  .from('profissionais')
  .select('id')
  .eq('user_id', user.id)
  .eq('ativo', true)
  .single();

if (!profissional) {
  return new Response(
    JSON.stringify({ error: "Only professionals can perform this action" }),
    { status: 403 }
  );
}
```

## Configuration Requirements

### Supabase Auth Settings
The following must be configured in Supabase Dashboard:

1. **OTP Expiry**: Set to 5 minutes maximum
2. **Leaked Password Protection**: MUST be enabled
3. **Email Rate Limiting**: Enable to prevent abuse
4. **PostgreSQL Version**: Keep updated with latest security patches

### Where to Configure
- Go to Authentication → Settings
- Navigate to Security section
- Enable all recommended protections

## Security Checklist

Before deploying any changes:

- [ ] No direct queries to `pacientes` table
- [ ] No direct queries to `users` table
- [ ] All forms have proper input validation
- [ ] No sensitive data in console.logs
- [ ] Edge functions check authentication
- [ ] Edge functions verify user roles
- [ ] Password requirements enforced
- [ ] Supabase Auth settings configured
- [ ] RLS policies tested for each role
- [ ] No client-side authorization decisions

## Reporting Security Issues

If you discover a security vulnerability:
1. DO NOT open a public issue
2. Contact the security team directly
3. Provide detailed information about the vulnerability
4. Wait for confirmation before disclosing

## References

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [LGPD (Brazilian Data Protection Law)](https://www.gov.br/cidadania/pt-br/acesso-a-informacao/lgpd)
