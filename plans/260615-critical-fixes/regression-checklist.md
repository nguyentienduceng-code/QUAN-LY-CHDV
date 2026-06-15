# Regression Testing Checklist

Run before every deployment.

## Static Checks
- [ ] `npm audit --production` → 0 high/critical
- [ ] `npm run lint` → 0 errors
- [ ] `npm run build` → success

## Functional Tests
- [ ] Login works (manager + tenant)
- [ ] All pages load without errors
- [ ] Excel export downloads valid file
- [ ] Generate periodic invoices modal works
- [ ] Tenant drawer displays data
- [ ] Error boundary catches test error

## Performance
- [ ] Build size < 1MB (dist/)
- [ ] Page loads < 3s (dev mode)
- [ ] No infinite render loops

## Security
- [ ] No HIGH/CRITICAL npm audit issues
- [ ] No exposed credentials in console
- [ ] localStorage only has expected keys
