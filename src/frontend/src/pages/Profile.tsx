import { useGetCallerUserProfile, useGetEmployee } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Mail, Phone, MapPin, Briefcase, Building } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function Profile() {
  const { data: userProfile } = useGetCallerUserProfile();
  const employeeId = userProfile?.employeeId || null;
  const { data: employee, isLoading } = useGetEmployee(employeeId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
        <p className="text-muted-foreground mt-1">View your employee information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
              <User className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <div className="font-semibold text-lg text-foreground">
                {employee?.name || userProfile?.name || 'Employee'}
              </div>
              <div className="text-sm text-muted-foreground">
                ID: {employeeId}
              </div>
            </div>
          </div>

          <div className="grid gap-4 pt-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Email</div>
                <div className="font-medium text-foreground">
                  {employee?.email || userProfile?.email || 'Not provided'}
                </div>
              </div>
            </div>

            {employee?.contactNumber && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Phone</div>
                  <div className="font-medium text-foreground">{employee.contactNumber}</div>
                </div>
              </div>
            )}

            {employee?.address && (
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Address</div>
                  <div className="font-medium text-foreground">{employee.address}</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {employee && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Employment Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Briefcase className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Job Title</div>
                <div className="font-medium text-foreground">{employee.jobTitle}</div>
              </div>
            </div>

            {employee.companyAssignment && (
              <div className="flex items-center gap-3">
                <Building className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Company</div>
                  <div className="font-medium text-foreground">{employee.companyAssignment}</div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Role</div>
                <Badge variant="secondary" className="mt-1">
                  {employee.role === 'manager' ? 'Manager' : 'Worker'}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-5 w-5" />
              <div>
                <div className="text-sm text-muted-foreground">Onboarding Status</div>
                <Badge 
                  variant={employee.onboardingStatus === 'completed' ? 'default' : 'secondary'}
                  className="mt-1"
                >
                  {employee.onboardingStatus === 'completed' ? 'Completed' : 'In Progress'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
