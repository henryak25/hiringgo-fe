"use client"

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "../ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { toast as sonnerToast } from "sonner";
import dynamic from "next/dynamic";
import { fetcher } from "@/components/lib/fetcher";

interface Lowongan {
    lowonganId: string;
    idMataKuliah: string;
    namaMataKuliah: string;
    tahunAjaran: string;
    semester: string;
    statusLowongan: string;
    judul: string;
    deskripsi: string;
    persyaratan: string;
    jumlahAsdosDibutuhkan: number;
    jumlahAsdosDiterima: number;
    jumlahAsdosPendaftar: number;
    idAsdosDiterima: string[];
}

interface ApplicationStatus {
    hasApplied: boolean;
    status: string;
    pendaftaranId?: string;
}

const DialogDetailLowongan = dynamic(() => import("../dashboard/mahasiswa/dialogDetailLowongan").then((mod) => mod.DialogDetailLowongan))

export default function ListLowongan({ data }: { data: Lowongan[] }) {
    const [lowonganBySemester, setLowonganBySemester] = useState<{
        [key: string]: Lowongan[];
    }>({});
    
    const [applicationStatus, setApplicationStatus] = useState<{
        [key: string]: ApplicationStatus;
    }>({});
    
    const [loadingStatus, setLoadingStatus] = useState<{
        [key: string]: boolean;
    }>({});

    useEffect(() => {
        const grouped = data.reduce((acc, lowongan) => {
            const key = `${lowongan.semester} ${lowongan.tahunAjaran}`;
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(lowongan);
            return acc;
        }, {} as { [key: string]: Lowongan[] });

        setLowonganBySemester(grouped);
        
        // Fetch application status for each lowongan
        data.forEach(lowongan => {
            fetchApplicationStatus(lowongan.lowonganId);
        });
    }, [data]);
    
    const fetchApplicationStatus = async (lowonganId: string) => {
        try {
            setLoadingStatus(prev => ({ ...prev, [lowonganId]: true }));
            
            const statusData = await fetcher<any>(`/api/lowongandaftar/${lowonganId}/status`, undefined, {
                method: "GET",
            });
            
            setApplicationStatus(prev => ({
                ...prev,
                [lowonganId]: statusData.data?.application_status || statusData.application_status
            }));
            console.log("Application status fetched:", statusData);
        } catch (error: any) {
            console.error("Error fetching application status:", error);
            // Don't show error toast for status checks as it's not critical
        } finally {
            setLoadingStatus(prev => ({ ...prev, [lowonganId]: false }));
        }
    };

    const handleApply = (lowongan: Lowongan) => {
        sonnerToast.success("Pendaftaran berhasil", {
            description: `Anda telah mendaftar untuk lowongan ${lowongan.namaMataKuliah}`,
            duration: 3000
        });
        
        fetchApplicationStatus(lowongan.lowonganId);
    };
    
    const getStatusBadge = (lowonganId: string) => {
        const status = applicationStatus[lowonganId];
        
        if (loadingStatus[lowonganId]) {
            return <Loader2 className="h-4 w-4 animate-spin" />;
        }
        
        if (!status || !status.hasApplied) {
            return <Badge variant="outline">Belum Mendaftar</Badge>;
        }
        
        switch (status.status) {
            case "DITERIMA":
                return <Badge className="bg-green-100 text-green-800">Diterima</Badge>;
            case "DITOLAK":
                return <Badge className="bg-red-100 text-red-800">Ditolak</Badge>;
            case "MENUNGGU":
                return <Badge className="bg-yellow-100 text-yellow-800">Menunggu</Badge>;
            default:
                return <Badge variant="outline">{status.status}</Badge>;
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-4">Daftar Lowongan</h1>
            <p className="mb-6">List lowongan yang tersedia untuk pendaftaran</p>

            {Object.entries(lowonganBySemester).map(([semester, lowongans]) => (
                <Card key={semester} className="mb-10">
                    <CardHeader>
                        <CardTitle className="text-xl font-semibold">{semester}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-gray-700">
                                    <TableRow>
                                        <TableHead className="text-white text-center w-[60px]">No</TableHead>
                                        <TableHead className="text-white">Mata Kuliah / Nama Lowongan</TableHead>
                                        <TableHead className="text-white">Status Lowongan</TableHead>
                                        <TableHead className="text-white">Jumlah Lowongan</TableHead>
                                        <TableHead className="text-white">Jumlah Pelamar</TableHead>
                                        <TableHead className="text-white">Jumlah Pelamar Diterima</TableHead>
                                        <TableHead className="text-white">Status Lamaran</TableHead>
                                        <TableHead className="text-white text-center">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {lowongans.map((lowongan, index) => (
                                        <TableRow 
                                            key={lowongan.lowonganId} 
                                            className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                                        >
                                            <TableCell className="text-center">{index + 1}</TableCell>
                                            <TableCell>
                                                {lowongan.idMataKuliah} - {lowongan.namaMataKuliah}
                                                {lowongan.judul && (
                                                    <div className="text-sm text-gray-500">{lowongan.judul}</div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={lowongan.statusLowongan === "DIBUKA" ? "default" : "secondary"}>
                                                    {lowongan.statusLowongan}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{lowongan.jumlahAsdosDibutuhkan} asisten</TableCell>
                                            <TableCell>{lowongan.jumlahAsdosPendaftar} mahasiswa</TableCell>
                                            <TableCell>{lowongan.jumlahAsdosDiterima} mahasiswa</TableCell>
                                            <TableCell>
                                                {getStatusBadge(lowongan.lowonganId)}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <DialogDetailLowongan 
                                                    lowongan={lowongan} 
                                                    onApply={() => handleApply(lowongan)}
                                                    applicationStatus={applicationStatus[lowongan.lowonganId]} 
                                                />
                                                
                                                {loadingStatus[lowongan.lowonganId] && (
                                                    <span className="ml-2 text-gray-500 text-xs">
                                                        <Loader2 className="h-3 w-3 animate-spin inline mr-1" />
                                                        Memuat status...
                                                    </span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}