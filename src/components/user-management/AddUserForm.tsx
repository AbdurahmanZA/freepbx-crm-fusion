
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { CreateUserData, User } from "@/services/userService";
import { useEffect } from "react";
import { PERMISSION_OPTIONS } from "@/lib/permissions";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  role: z.string().min(1, { message: "Role is required."}),
  extension: z.string().min(3, { message: "Extension must be at least 3 digits." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }).optional(),
  confirmPassword: z.string().optional(),
  permissions: z.array(z.string()).optional(),
  webmailUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')), // Added webmailUrl
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type AddUserFormValues = z.infer<typeof formSchema>;

interface AddUserFormProps {
  onSave: (data: CreateUserData) => void;
  onCancel: () => void;
  editingUser: User | null;
}

const AddUserForm = ({ onSave, onCancel, editingUser }: AddUserFormProps) => {
  const form = useForm<AddUserFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "Agent",
      extension: "",
      password: "",
      confirmPassword: "",
      permissions: [],
      webmailUrl: "", // Added webmailUrl
    },
  });

  useEffect(() => {
    if (editingUser) {
      form.reset({
        name: editingUser.name,
        email: editingUser.email,
        role: editingUser.role,
        extension: editingUser.extension,
        password: "", // Password fields are usually not pre-filled for editing
        confirmPassword: "",
        permissions: editingUser.permissions || [],
        webmailUrl: editingUser.webmailUrl || "", // Added webmailUrl
      });
    } else {
      form.reset({ // Reset to default for new user
        name: "",
        email: "",
        role: "Agent",
        extension: "",
        password: "",
        confirmPassword: "",
        permissions: [],
        webmailUrl: "",
      });
    }
  }, [editingUser, form]);

  function onSubmit(data: AddUserFormValues) {
    const { confirmPassword, ...userData } = data; // eslint-disable-line @typescript-eslint/no-unused-vars
    
    // If not editing, password is required
    if (!editingUser && !userData.password) {
        form.setError("password", { type: "manual", message: "Password is required for new users." });
        return;
    }

    const finalUserData: CreateUserData = {
        name: userData.name,
        email: userData.email,
        role: userData.role,
        extension: userData.extension,
        // Password should only be included if provided (for new user or password change)
        password: userData.password || '', 
        permissions: userData.permissions || [],
        webmailUrl: userData.webmailUrl || undefined, // Ensure empty string becomes undefined
    };
    onSave(finalUserData);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4 border rounded-lg bg-card">
        <h2 className="text-xl font-semibold mb-4">{editingUser ? "Edit User" : "Add New User"}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="john.doe@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Administrator">Administrator</SelectItem>
                      <SelectItem value="Manager">Manager</SelectItem>
                      <SelectItem value="Agent">Agent</SelectItem>
                    </SelectContent>
                  </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="extension"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Extension</FormLabel>
                <FormControl>
                  <Input placeholder="1001" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{editingUser ? "New Password (optional)" : "Password"}</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="******" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="******" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="webmailUrl"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Webmail URL (optional)</FormLabel>
                <FormControl>
                  <Input placeholder="https://webmail.example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="permissions"
          render={() => (
            <FormItem className="md:col-span-2">
              <div className="mb-4">
                <FormLabel className="text-base">Permissions</FormLabel>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PERMISSION_OPTIONS.map((permission) => (
                  <FormField
                    key={permission.id}
                    control={form.control}
                    name="permissions"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={permission.id}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(permission.id)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...(field.value || []), permission.id])
                                  : field.onChange(
                                      (field.value || []).filter(
                                        (value) => value !== permission.id
                                      )
                                    )
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {permission.label}
                          </FormLabel>
                        </FormItem>
                      )
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">{editingUser ? "Save Changes" : "Add User"}</Button>
        </div>
      </form>
    </Form>
  );
};

export default AddUserForm;
