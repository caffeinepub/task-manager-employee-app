import { useState } from 'react';
import { useGetCallerUserProfile, useGetOnboardingData, useSubmitOnboardingData } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ExternalBlob, OnboardingStatus } from '../backend';
import { CheckCircle2, Circle, Upload, Loader2 } from 'lucide-react';

export default function Onboarding() {
  const { data: userProfile } = useGetCallerUserProfile();
  const employeeId = userProfile?.employeeId || null;
  const { data: onboardingData, isLoading } = useGetOnboardingData(employeeId);
  const submitOnboarding = useSubmitOnboardingData();

  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');
  const [contactDetails, setContactDetails] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [w4File, setW4File] = useState<File | null>(null);
  const [i9File, setI9File] = useState<File | null>(null);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const steps = [
    { number: 1, title: 'Personal Info', completed: step > 1 },
    { number: 2, title: 'Employment', completed: step > 2 },
    { number: 3, title: 'Documents', completed: step > 3 },
    { number: 4, title: 'Complete', completed: false },
  ];

  const handleFileToBlob = async (file: File): Promise<ExternalBlob> => {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    return ExternalBlob.fromBytes(uint8Array);
  };

  const handleSubmit = async () => {
    if (!employeeId || !w4File || !i9File || !idFile) {
      toast.error('Please complete all required fields');
      return;
    }

    setUploading(true);
    try {
      const w4Blob = await handleFileToBlob(w4File);
      const i9Blob = await handleFileToBlob(i9File);
      const idBlob = await handleFileToBlob(idFile);
      const emptyBlob = ExternalBlob.fromBytes(new Uint8Array(0));

      await submitOnboarding.mutateAsync({
        employeeId,
        personalInfo: {
          firstName,
          lastName,
          address,
          contactDetails,
        },
        employmentDetails: {
          jobTitle,
          department,
          startDate: BigInt(Date.now() * 1000000),
          referenceTaskId: undefined,
        },
        forms: {
          w4: w4Blob,
          i9: i9Blob,
          identification: idBlob,
          onboarding: emptyBlob,
        },
        status: OnboardingStatus.completed,
        timestamp: BigInt(Date.now() * 1000000),
        referenceTaskId: undefined,
      });

      toast.success('Onboarding completed successfully!');
      setStep(4);
    } catch (error) {
      toast.error('Failed to submit onboarding data');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (onboardingData?.status === OnboardingStatus.completed) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Onboarding</h1>
          <p className="text-muted-foreground mt-1">Your onboarding is complete</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle2 className="h-16 w-16 text-green-600 mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Onboarding Complete!</h2>
            <p className="text-muted-foreground text-center">
              You have successfully completed the onboarding process.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = (step / 4) * 100;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Employee Onboarding</h1>
        <p className="text-muted-foreground mt-1">Complete your onboarding process</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={progress} className="mb-4" />
          <div className="flex justify-between">
            {steps.map((s) => (
              <div key={s.number} className="flex flex-col items-center gap-2">
                {s.completed ? (
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                ) : (
                  <Circle className={`h-8 w-8 ${step === s.number ? 'text-primary' : 'text-muted-foreground'}`} />
                )}
                <span className="text-xs text-center">{s.title}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main St, City, State 12345"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact">Contact Details</Label>
              <Input
                id="contact"
                value={contactDetails}
                onChange={(e) => setContactDetails(e.target.value)}
                placeholder="Phone: (555) 123-4567"
              />
            </div>
            <Button onClick={() => setStep(2)} disabled={!firstName || !lastName || !address || !contactDetails}>
              Next
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Employment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job Title</Label>
              <Input
                id="jobTitle"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Software Engineer"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Engineering"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={() => setStep(3)} disabled={!jobTitle || !department}>Next</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Document Upload</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="w4">W-4 Form</Label>
              <Input
                id="w4"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setW4File(e.target.files?.[0] || null)}
              />
              {w4File && <p className="text-sm text-muted-foreground">Selected: {w4File.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="i9">I-9 Form</Label>
              <Input
                id="i9"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setI9File(e.target.files?.[0] || null)}
              />
              {i9File && <p className="text-sm text-muted-foreground">Selected: {i9File.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="id">Identification Document</Label>
              <Input
                id="id"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setIdFile(e.target.files?.[0] || null)}
              />
              {idFile && <p className="text-sm text-muted-foreground">Selected: {idFile.name}</p>}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
              <Button onClick={handleSubmit} disabled={!w4File || !i9File || !idFile || uploading}>
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Submit
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
