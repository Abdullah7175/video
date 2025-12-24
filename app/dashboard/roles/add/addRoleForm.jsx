"use client"

import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useRoleContext } from '../RoleContext';
import { useToast } from "@/hooks/use-toast";


const validationSchema = Yup.object({
    name: Yup.string()
        .required('Name is required')
        .min(3, 'Name must be at least 3 characters'),
    email: Yup.string()
        .email('Invalid email format')
        .required('Email is required'),
    contact: Yup.number()
        .min(11, 'Number must be 11 digits'),
    address: Yup.string()
        .min(3, 'Address must be at least 3 characters'),
});

const RoleForm = () => {
    const { role, updateRole } = useRoleContext();
    const { toast } = useToast();
    const [isSuccess, setIsSuccess] = useState(false);
    const formik = useFormik({
        initialValues: {
            title: role.title || '',
            email: role.email || '',

        },
        validationSchema,
        enableReinitialize: true,
        onSubmit: async (values) => {
            updateRole(values);
            try {
                const response = await fetch('/api/socialmediaperson', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(values),
                });

                if (response.ok) {
                    toast({
                        title: "Agent added successfully",
                        description: '',
                        variant: 'success',
                    });
                    setIsSuccess(true);
                } else {
                    toast({
                        title: "Failed to add agent",
                        description: '',
                        variant: 'destructive',
                    });
                }
            } catch (error) {
                console.error('Error submitting form:', error);
                toast({
                    title: "An error occurred while adding the agent",
                    description: '',
                    variant: 'destructive',
                });
            }
        },
    });

    if (isSuccess) {
        window.location.href = '/dashboard/socialmediaagent';
    }


    return (
        <div className='container'>
            <form onSubmit={formik.handleSubmit} className="max-w-7xl mx-auto p-6 bg-white shadow-sm rounded-lg space-y-6 border">
                <div>
                    <label htmlFor="name" className="block text-gray-700 text-sm font-medium">Name</label>
                    <input
                        id="name"
                        name="name"
                        type="text"
                        onChange={formik.handleChange}
                        value={formik.values.name}
                        className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    {formik.errors.name && formik.touched.name && <div className="text-red-600 text-sm mt-2">{formik.errors.name}</div>}
                </div>
                <div>
                    <label htmlFor="title" className="block text-gray-700 text-sm font-medium">Title</label>
                    <input
                        id="title"
                        name="title"
                        type="text"
                        onChange={formik.handleChange}
                        value={formik.values.name}
                        className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    {formik.errors.name && formik.touched.name && <div className="text-red-600 text-sm mt-2">{formik.errors.name}</div>}
                </div>
                <div className='flex justify-end'>
                    <button
                        type="submit"
                        className="px-4 py-2 mt-4 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        Add Role
                    </button>
                </div>
            </form>
        </div>
    );
};

export default RoleForm;
