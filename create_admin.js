// Script tạo tài khoản Super Admin trong Firebase Auth
const API_KEY = 'AIzaSyB9T0kXiLB7vCh3zeP5KmesCD8o53rov1o';
const EMAIL = 'nguyentienducbmt123@gmail.com';
const PASSWORD = '123456';

async function main() {
  // Bước 1: Thử đăng nhập trước
  console.log('🔍 Kiểm tra tài khoản trong Firebase Auth...');
  try {
    const signInRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: EMAIL, password: PASSWORD, returnSecureToken: true })
      }
    );
    const signInData = await signInRes.json();
    
    if (signInData.localId) {
      console.log('✅ Tài khoản đã tồn tại và mật khẩu đúng!');
      console.log('   UID:', signInData.localId);
      console.log('   Email:', signInData.email);
      return;
    }
    
    if (signInData.error) {
      console.log('⚠️ Lỗi đăng nhập:', signInData.error.message);
      
      if (signInData.error.message === 'EMAIL_NOT_FOUND') {
        // Bước 2: Tạo tài khoản mới
        console.log('📝 Tạo tài khoản mới...');
        const signUpRes = await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: EMAIL, password: PASSWORD, returnSecureToken: true })
          }
        );
        const signUpData = await signUpRes.json();
        
        if (signUpData.localId) {
          console.log('✅ Tạo tài khoản THÀNH CÔNG!');
          console.log('   UID:', signUpData.localId);
          console.log('   Email:', signUpData.email);
        } else {
          console.log('❌ Tạo tài khoản thất bại:', signUpData.error?.message);
        }
      } else if (signInData.error.message === 'INVALID_LOGIN_CREDENTIALS' || signInData.error.message === 'INVALID_PASSWORD') {
        console.log('⚠️ Tài khoản tồn tại nhưng SAI MẬT KHẨU!');
        console.log('   Cần đổi mật khẩu trong Firebase Console.');
      } else {
        console.log('❌ Lỗi không xác định:', signInData.error.message);
      }
    }
  } catch (err) {
    console.error('❌ Lỗi kết nối:', err.message);
  }
}

main();
