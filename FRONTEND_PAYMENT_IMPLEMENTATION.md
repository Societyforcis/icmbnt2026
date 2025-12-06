# Complete Frontend Implementation Guide for Payment Registration

## Step 1: Add Required Imports to Registrations.tsx

Add these imports at the top (around line 1-20):

```typescript
import { CheckCircle, Loader } from 'lucide-react'; // Add to existing lucide imports
```

## Step 2: Add State Variables

Add these state variables after line 92 (after existing formData state):

```typescript
const [paymentMethod, setPaymentMethod] = useState<'bank-transfer' | 'paypal' | ''>('');
const [paymentScreenshot, setPaymentScreenshot] = useState<string>('');
const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pending'>('pending');
```

## Step 3: Add Image Compression Function

Add this helper function before the component (around line 25):

```typescript
// Image compression function
const compressImage = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        resolve(compressedBase64);
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};
```

## Step 4: Update handleSubmit Function

Replace the existing handleSubmit function (around line 177-187) with this:

```typescript
const handleSubmit = useCallback(async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Validation
  if (!selectedCategory) {
    Swal.fire({
      icon: 'error',
      title: 'Category Required',
      text: 'Please select a registration category',
      confirmButtonColor: '#dc2626',
    });
    return;
  }

  if (!paymentMethod) {
    Swal.fire({
      icon: 'error',
      title: 'Payment Method Required',
      text: 'Please select a payment method',
      confirmButtonColor: '#dc2626',
    });
    return;
  }

  if (paymentMethod === 'bank-transfer' && !paymentScreenshot) {
    Swal.fire({
      icon: 'error',
      title: 'Payment Screenshot Required',
      text: 'Please upload your payment screenshot',
      confirmButtonColor: '#dc2626',
    });
    return;
  }

  try {
    Swal.fire({
      title: 'Submitting Registration...',
      text: 'Please wait',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    const token = localStorage.getItem('token');
    
    const response = await axios.post(
      `${API_URL}/api/registration/submit`,
      {
        fullName: formData.fullName,
        email: formData.email,
        institution: formData.institution,
        address: formData.address,
        country: formData.country,
        paperTitle: formData.paperTitle,
        submissionId: '', // Add if you have it
        paymentMethod,
        transactionId: formData.transactionId,
        amount: formData.amount,
        paymentScreenshot,
        registrationCategory: selectedCategory,
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    Swal.close();

    if (response.data.success) {
      Swal.fire({
        icon: 'success',
        title: 'Registration Submitted!',
        html: `
          <p>Your registration has been submitted successfully!</p>
          <p class="mt-2 text-sm text-gray-600">Please wait for admin verification of your payment.</p>
          <p class="mt-2 text-sm text-gray-600">You will be notified once your payment is verified.</p>
        `,
        confirmButtonColor: '#dc2626',
      });

      // Reset form
      setFormData({
        fullName: '',
        email: '',
        institution: '',
        address: '',
        country: '',
        paperTitle: '',
        transactionId: '',
        date: '',
        amount: '',
      });
      setPaymentMethod('');
      setPaymentScreenshot('');
      setSelectedCategory('');
    }
  } catch (error: any) {
    Swal.close();
    console.error('Registration submission error:', error);
    
    Swal.fire({
      icon: 'error',
      title: 'Submission Failed',
      text: error.response?.data?.message || 'Failed to submit registration. Please try again.',
      confirmButtonColor: '#dc2626',
    });
  }
}, [formData, selectedCategory, paymentMethod, paymentScreenshot]);
```

## Step 5: Add Payment UI in the Form

Find the form section (around line 500-700) and add this AFTER the registration category selection and BEFORE the submit button:

```tsx
{/* Payment Method Selection */}
{selectedCategory && (
  <div className="space-y-6 mt-8">
    <div className="space-y-4">
      <label className="block text-sm font-semibold text-gray-800">
        <CreditCard className="inline h-4 w-4 mr-2 text-red-500" />
        Select Payment Method <span className="text-red-500">*</span>
      </label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => setPaymentMethod('bank-transfer')}
          className={`p-6 rounded-xl border-2 transition-all duration-200 ${
            paymentMethod === 'bank-transfer'
              ? 'border-red-500 bg-red-50 shadow-lg'
              : 'border-gray-200 hover:border-red-300'
          }`}
        >
          <div className="flex items-center justify-center mb-3">
            <div className={`p-3 rounded-lg ${paymentMethod === 'bank-transfer' ? 'bg-red-100' : 'bg-gray-100'}`}>
              <Building className="h-8 w-8 text-red-500" />
            </div>
          </div>
          <h3 className="font-bold text-lg mb-1">Bank Transfer</h3>
          <p className="text-sm text-gray-600">Transfer to bank account</p>
        </button>

        <button
          type="button"
          onClick={() => {
            Swal.fire({
              icon: 'info',
              title: 'Coming Soon',
              text: 'PayPal payment option will be available soon!',
              confirmButtonColor: '#dc2626',
            });
          }}
          className="p-6 rounded-xl border-2 border-gray-200 hover:border-gray-300 opacity-60 cursor-not-allowed"
        >
          <div className="flex items-center justify-center mb-3">
            <div className="p-3 rounded-lg bg-gray-100">
              <CreditCard className="h-8 w-8 text-gray-400" />
            </div>
          </div>
          <h3 className="font-bold text-lg mb-1">PayPal</h3>
          <p className="text-sm text-gray-600">Coming Soon</p>
        </button>
      </div>
    </div>

    {/* Bank Transfer Details */}
    {paymentMethod === 'bank-transfer' && (
      <>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-2xl border-2 border-green-200">
          <h3 className="text-xl font-bold text-center mb-6">Bank Account Details</h3>
          <div className="space-y-4 max-w-md mx-auto">
            <div className="flex justify-between items-center p-4 bg-white rounded-lg">
              <span className="font-semibold text-gray-600">Account Name:</span>
              <span className="font-bold">Society for Cyber</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-white rounded-lg">
              <span className="font-semibold text-gray-600">Account Number:</span>
              <span className="font-bold">8067349218</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-white rounded-lg">
              <span className="font-semibold text-gray-600">IFSC Code:</span>
              <span className="font-bold">IDIB000R076</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-white rounded-lg">
              <span className="font-semibold text-gray-600">Bank Name:</span>
              <span className="font-bold">Indian Bank</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-white rounded-lg">
              <span className="font-semibold text-gray-600">UPI ID:</span>
              <span className="font-bold">societyforcyber@indianbk</span>
            </div>
          </div>
        </div>

        {/* Transaction ID */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-800">
            Transaction ID / Reference Number
          </label>
          <input
            type="text"
            name="transactionId"
            value={formData.transactionId}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
            placeholder="Enter your transaction ID"
          />
        </div>

        {/* Payment Screenshot Upload */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-800">
            Upload Payment Screenshot <span className="text-red-500">*</span>
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-red-400 transition-all duration-200">
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                try {
                  const file = e.target.files?.[0];
                  if (file) {
                    console.log('📸 Payment screenshot file selected:', file.name);
                    const compressedBase64 = await compressImage(file);
                    setPaymentScreenshot(compressedBase64);
                    console.log('✅ Payment screenshot compressed and set');
                  }
                } catch (error) {
                  console.error('❌ Payment screenshot upload error:', error);
                  Swal.fire({
                    icon: 'error',
                    title: 'Upload Failed',
                    text: 'Failed to upload payment screenshot',
                    confirmButtonColor: '#dc2626',
                  });
                }
              }}
              className="hidden"
              id="payment-screenshot"
            />
            <label htmlFor="payment-screenshot" className="cursor-pointer">
              {paymentScreenshot ? (
                <div className="space-y-3">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                  <p className="text-sm font-semibold text-green-600">Screenshot uploaded successfully!</p>
                  
                  <div className="mt-4 border-2 border-green-200 rounded-lg p-2 bg-green-50">
                    <img 
                      src={paymentScreenshot} 
                      alt="Payment Screenshot Preview" 
                      className="max-h-40 mx-auto rounded"
                    />
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-2">Click to change</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <CreditCard className="h-12 w-12 text-gray-400 mx-auto" />
                  <p className="text-sm font-semibold text-gray-700">Click to upload payment screenshot</p>
                  <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                </div>
              )}
            </label>
          </div>
        </div>

        {/* Payment Status Confirmation */}
        {paymentScreenshot && (
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-gray-800">
              Payment Status <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setPaymentStatus('paid')}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  paymentStatus === 'paid'
                    ? 'border-green-500 bg-green-50 shadow-lg'
                    : 'border-gray-200 hover:border-green-300'
                }`}
              >
                <CheckCircle className={`h-8 w-8 mx-auto mb-2 ${paymentStatus === 'paid' ? 'text-green-500' : 'text-gray-400'}`} />
                <p className="font-bold">Payment Completed</p>
                <p className="text-xs text-gray-600 mt-1">I have completed the payment</p>
              </button>
              
              <button
                type="button"
                onClick={() => setPaymentStatus('pending')}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  paymentStatus === 'pending'
                    ? 'border-yellow-500 bg-yellow-50 shadow-lg'
                    : 'border-gray-200 hover:border-yellow-300'
                }`}
              >
                <Loader className={`h-8 w-8 mx-auto mb-2 ${paymentStatus === 'pending' ? 'text-yellow-500' : 'text-gray-400'}`} />
                <p className="font-bold">Payment Pending</p>
                <p className="text-xs text-gray-600 mt-1">Payment is in process</p>
              </button>
            </div>
          </div>
        )}
      </>
    )}
  </div>
)}
```

## Step 6: Update Submit Button

Make sure the submit button is enabled only when all required fields are filled:

```tsx
<button
  type="submit"
  disabled={!selectedCategory || !paymentMethod || (paymentMethod === 'bank-transfer' && !paymentScreenshot)}
  className="w-full bg-gradient-to-r from-blue-900 to-[#F5A051] text-white py-4 px-6 rounded-xl font-semibold text-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
>
  Submit Registration
</button>
```

## Summary

This implementation:
1. ✅ Adds payment method selection (Bank Transfer + PayPal Coming Soon)
2. ✅ Shows bank account details when bank transfer is selected
3. ✅ Allows users to upload payment screenshot with compression
4. ✅ Collects transaction ID
5. ✅ Validates all required fields before submission
6. ✅ Submits to backend API
7. ✅ Shows success/error messages
8. ✅ Resets form after successful submission

The backend will:
1. Store registration in PaymentRegistration collection
2. Admin can verify payment
3. Upon verification, creates record in PaymentDoneFinalUser collection
4. Auto-generates registration number
5. Updates FinalAcceptance payment status

---

**Next**: Create admin payment verification page to approve/reject payments
